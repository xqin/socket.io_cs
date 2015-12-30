(function() {
	var $messages = $('#messages'), // 消息显示区域
		$inputMessage = $('#inputMessage'), // 消息输入框
		username,//用户名
		userid,//用户id
		connected = false,//记录 连接状态
		linked = false,//记录 是否已经有 客服 与当前用户连接
		socket = io(),
		isKF = !!window.kefu;//判断当前处于哪种模式

	if(window.name){
		var t = (window.name + '').split('|');
		username = t.shift();
		userid = t.shift();
	}else{
		userid = Math.random().toString().substr(3, isKF ? 5 : 8) * 10000
		//生成昵称
		username = (isKF ? '客服' : '访客') + '(' + userid + ')';
		userid = new Date().getTime() + '.' + userid.toString(32);

		//将生成的昵称和id保存至 window.name 中, 这样在不关闭窗口的情况下, 保证一直是同一个昵称和id
		window.name = [username, userid].join('|');

		//目前这些数据是随机生成的, 仅做DEMO使用, 在真实情况下, 请根据自己的需求进行修改
	}

	log('正在连接服务器...');

	socket.on('connect', function(){
		connected = true;

		//连接成功后, 向服务器发送 登陆请求, 传递用户名和userid
		socket.emit('login', {name:username, id:userid, type: isKF ? 1 : 0});
	});

	//服务器找到 有可用的客服的时候, 向客户端推送的 消息
	socket.on('linked', function(name){
		linked = true;

		log(isKF ? '与用户关联成功!' : '与客服连接成功');
	});

	//连接出现错误时
	socket.on('error', function(){
		linked = connected = false;
		log('连接已断开...');
	});

	//收到服务器发来的 log 事件时
	socket.on('log', function(msg){
		log(msg);
	});

	//收到消息时
	socket.on('new message', function (data) {
		addChatMessage(data);
	});

	//表单中按回车, 发送消息
	$('form').on('submit', function(){
		sendMessage();
		return false;
	});


	function sendMessage () {
		var message = $inputMessage.val();

		message = cleanInput(message);

		if(!message){//如果过滤后的内容为空
			return;
		}

		// 有输入内容, 且已经连接成功, 且当前有客服和他匹配
		if (connected && linked) {
			$inputMessage.val('');

			addChatMessage({
				color: '#008040',
				username: username,
				message: message
			});

			socket.emit('new message', {id:userid, message:message});
		}else{
			log(connected ? (//连接成功, 但还没有 匹配成功
				isKF ? '还没有访客接入, 不能发送消息 ...' : '客服忙, 请稍等 ...'
			) : '正在连接服务器...');//未连接成功时的提示文字
		}
	}

	function cleanInput(text){
		return $('<div/>').text(text).text();
	}

	// Log a message
	function log (message) {
		addMessageElement($('<li>').addClass('log').text(message));
	}

	// Adds the visual chat message to the message list
	function addChatMessage (data) {
		var $usernameDiv = $('<span class="username"/>').text(data.username).css('color', data.color || '#00f');
		var $messageBodyDiv = $('<span class="messageBody">').text(data.message);
		var $messageDiv = $('<li class="message"/>')
			.data('username', data.username)
			.append($usernameDiv, formatDate(new Date()) + '<br/>', $messageBodyDiv);

		addMessageElement($messageDiv);
	}

	//时间格式化
	function formatDate(t){
		var M = t.getMonth() + 1,
			D = t.getDate(),
			H = t.getHours(),
			m = t.getMinutes(),
			s = t.getSeconds();

		return [M, '-', D, ' ', H, ':', m, ':', s].join('');
	}

	function addMessageElement (el) {
		$messages.append($(el).hide().fadeIn(200));
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}
})();
