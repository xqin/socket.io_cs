var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = 8163;

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});


app.use(express.static(__dirname + '/public'));


var onlineUsers = {},//保存 在线访客/客服 的数据
	timers = {};//保存计时器, 用于在没有可用客服时, 继续查找 可用的客服

/*
	{
		uid: //唯一ID
		name: 昵称
		type: 0/1 (0 为普通用户, 1为客服)
		target: 保存与之关联的那个用户/客服
		available: true/false 只有当 type === 1 的时候, 该属性才起作用, 用于标记, 当前这个客服 是否可用
		socket: 保存当前这个用户的 socket
	}
*/

function tryFindKefuForUid(uid){
	if(typeof onlineUsers[uid] === 'undefined'){
		clearTimeout(timers[uid]);
		return;
	}

	//不需要为客服查找用户
	if(onlineUsers[uid].type === 1){
		return;
	}

	var kefu;

	for(var id in onlineUsers){
		kefu = onlineUsers[id];

		//查找可用的客服
		if(kefu.type === 1 && kefu.available){
			//找到后将其标记为不可用
			kefu.available = false;


			//进行绑定, 将这个客服 的 target 指向那个用户
			kefu.target = onlineUsers[uid];

			//双向绑定
			onlineUsers[uid].target = kefu;

			//向这个用户发送 已经找到客服了
			onlineUsers[uid].socket.emit('linked', kefu.name);

			//向客服发送消息, 告诉他已经和某个用户 匹配上了
			kefu.socket.emit('linked', onlineUsers[uid].name);

			log(kefu.target.name, '\t找到了可用的客服:', kefu.name);
			return;
		}
	}

	log(onlineUsers[uid].name, '\t未找到可用客服, 延时5秒后重试!');

	//当没找到可用的客服时, 每隔5秒检测一次
	timers[uid] = setTimeout(tryFindKefuForUid.bind(null, uid), 5*1000);
}

function getCurTime(){
	var t = new Date(),
		M = t.getMonth() + 1,
		D = t.getDate(),
		H = t.getHours(),
		m = t.getMinutes(),
		s = t.getSeconds();

	return [M, '-', D, ' ', H, ':', m, ':', s].join('');
}

function log(){
	var msg = Array.prototype.slice.call(arguments);
	msg.unshift('[' + getCurTime() + ']');

	console.log.apply(console, msg);
}

function addUser(data){
	data = data || {};

	var uid = data.id || '',
		name = data.name || '';

	//没有UID或者昵称, 或者已经存在的, 触发 error
	if(!uid || !name || typeof onlineUsers[uid] !== 'undefined'){
		this.emit('error');
		return;
	}

	//将 UID 记录至当前的 socket 中, 以便在 disconnect 时使用
	this.uid = uid;

	onlineUsers[uid] = {
		uid: uid,
		name: name,
		type: data.type === 1 ? 1 : 0,
		available: data.type === 1,
		socket: this
	};

	if(onlineUsers[uid].type === 1){//如果是客服
		log(name, '\t登入系统!');

		this.emit('log', '欢迎登陆!');
	}else{//普通用户, 则自动查找客服
		log(name, '\t来了...');

		this.emit('log', '连接成功, 正在为你转接客服... ');

		tryFindKefuForUid(uid);
	}
}

function removeUser(){
	var uid = this.uid,
		user = onlineUsers[uid];

	if(!uid || !user){
		return;
	}

	log(user.name, '\t关闭了会话!');

	var target = user.target;

	if(target){
		switch(user.type){
			case 1://客服
				if(target.socket){
					target.socket.emit('log', '客服已退出会话!');
					target.socket.emit('error');
				}
				break;
			default:
				target.available = true;//恢复 与当前访客所关联的那个 客服的可用状态

				if(target.socket){//告诉客服和你会话的这个人,关闭了连接
					target.socket.emit('log', '访客已关闭会话');
				}
				break;
		}

		delete target.target;//断开 关联
		delete user.target;//断开 关联
	}

	clearTimeout(timers[uid]);

	target = user = null;

	//从在线用户列表中, 删除这个用户
	delete onlineUsers[uid];
}

function onMessage(data){
	data = data || {};

	var uid = this.uid,
		message = data.message,
		user = onlineUsers[uid];


	//没有UID, 或者UID是无效的, 或者这个用户没有与之关联的那个人, 或者 没有消息, 则什么也不做
	if(!uid || !user || !user.target || !message){
		return;
	}

	log(user.name, ':', message);

	//将消息转发到与当前用户对应的那个人身上 =,=
	user.target.socket.emit('new message', {username:user.name, message: message});
}

function onError(e){
	if(e){
		var user = onlineUsers[this.uid];

		if(user){
			log(user.name, e);
		}else{
			log(this.uid, e);
		}

		//出错时, 尝试将当前 socket 所对应的用户 从 onlineUser 中移除掉
		removeUser.call(this);
	}
}


io.on('connection', function (socket) {
	//连接成功后, 用户登陆
	socket.on('login', addUser);

	//连接断开
	socket.on('disconnect', removeUser);

	//收到客户发来的消息
	socket.on('new message', onMessage);

	socket.on('error', onError);
});
