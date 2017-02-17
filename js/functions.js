(function($){
	var config = {
		apiKey: "AIzaSyAFX9Z4hp8CGJXkWmqVV6KItkDwFuZnUuo",
		authDomain: "appgama-da610.firebaseapp.com",
		databaseURL: "https://appgama-da610.firebaseio.com",
		storageBucket: "appgama-da610.appspot.com",
		messagingSenderId: "686379293112"
	};

	var userListener = new UserListeners;
	var likeListener = new LikeListeners;
	var comentarioListener = new ComentariosListeners;

	var login = {
		id: null,
		auth: null,
		data: {}
	};

	var evento = {};

	var database = null;

	$(function(){
		firebase.initializeApp(config);
		database = firebase.database();


		firebase.auth().onAuthStateChanged(function(user) {
		  if (user) {
		    login.id = user.uid;
		    login.auth = user;
		    console.log('Logged', user);

		    userListener.listenUser(user.uid);
		    likeListener.listen(user.uid);
			comentarioListener.listen();
		  } else {
		  	authAnonymously();
		  }
		});


		$('.identificacao').identificacao();
		$('.interassoes').interassoes();
		$('.likes').likes();
		$('.comentarios').comentarios();

		userListener.addListener(function(data){
			login.data = data;

		  	loggedIn();
		});


		window.onunload = function(){
			userListener.clear();

			loggedOff();
		};
	});


	function authAnonymously(){
	    firebase.auth().signInAnonymously().catch(function(error) {
		  var errorCode = error.code;
		  var errorMessage = error.message;


		  console.log('Error', error);
		});
	}

	function loggedIn(){
		database.ref('/user/' + login.id).update({
			logged: true
		});
	}

	function loggedOff(){
		database.ref('/user/' + login.id).update({
			logged: false,
			logoff_at: (new Date).getTime()
		});
	}

	function identificarUsuario(nome, email){
		database.ref('/user/' + login.id).update({
			nome: nome,
			email: email,
			enter_at: (new Date).getTime()
		});
	}

	function like(like){
		database.ref('/like/' + login.id).update({
			nome: login.data.nome,
			email: login.data.email,
			liked: like,
			data: (new Date).getTime()
		});
	}

	function deixarComentario(comentario){
		var key = database.ref().child('comentarios').push().key;

		database.ref('/comentarios/' + key ).set({
			comentario: comentario,
			data: (new Date).getTime(),
			user: {
				id: login.id,
				nome: login.data.nome,
				email: login.data.email
			}
		});
	}

	$.fn.identificacao = function(){
		return this.each(function(){
			var $this = $(this),
				$nome = $this.find('.nome'),
				$email = $this.find('.email');

			if(login.data.name && login.data.name != ''){
				close();
			}else{
				open();
			}

			$this.submit(function(event){
				event.preventDefault();

				identificarUsuario($nome.val(), $email.val());
			});

			userListener.addListener(function(data){
				if(data.nome && data.nome != ''){
					close();
				}else{
					open();
				}
			});

			function close(){
				$this.fadeOut('fast');
			}

			function open(){
				$this.fadeIn('fast');
			}
		});
	};

	$.fn.interassoes = function(){
		return this.each(function(){
			var $this = $(this),
				$input = $this.find('.comentario');

			$this.submit(function(event){
				event.preventDefault();

				deixarComentario($input.val());

				$input.val('');
			});

			userListener.addListener(function(data){
				if(data.nome && data.nome != ''){
					enable();
				}else{
					disable();
				}
			});

			function enable(){
				$this.find('.btn-icon').prop('disabled', false);
				$this.find('.send').removeClass('disabled').prop('disabled', false);
				$this.find('.campo-texto').slideDown();
				$this.find('.mensagem').slideUp();
			}

			function disable(){
				$this.find('.btn-icon').prop('disabled', true);
				$this.find('.send').addClass('disabled').prop('disabled', true);
				$this.find('.campo-texto').slideUp();
				$this.find('.mensagem').slideDown();

			}
		});
	};

	$.fn.likes = function(){
		return this.each(function(){
			var $this = $(this),
				$like = $this.find('.like'),
				$dislike = $this.find('.dislike');

			var liked = null;

			likeListener.addListener(function(data){
				if(data === null){
					return;
				}

				liked = data.liked;

				classes();
			});

			$like.click(function(){
				like(true);
			});

			$dislike.click(function(){
				like(false);
			});

			function classes(){
				$like.removeClass('liked');
				$dislike.removeClass('disliked');

				if(liked === null){
					return;
				}

				if(liked){
					$like.addClass('liked');
				}else{
					$dislike.addClass('disliked');
				}
			}
		});
	};

	$.fn.comentarios = function(){
		return this.each(function(){
			var $this = $(this);

			comentarioListener.addListener(function(action, key, data){
				if(action == 'child_added'){
					$this.prepend(renderComentario(key, data));
					return;
				}

				if(action == 'child_removed'){
					$this.find('#' + key).remove();
					return;
				}
			});

		});

		function renderComentario(key, data){
			return '<div id="' + key + '" class="card card-panel teal white comentario">' +
              '<p>' + data.comentario.nl2br() + '</p>' +
              '<div class="card-action">' +
                '<h6>' + data.user.nome + '</h6>' +
                '<small>' + timestampToData(data.data) + '</small>' +
              '</div>' +
            '</div>';
		}

	};

	function Listener(){
	}

	Listener.prototype.listeners = [];
	Listener.prototype.addListener = function(callback){
		this.listeners.push(callback);
	}
	Listener.prototype.clear = function(){
		this.listeners = [];
	}

	function UserListeners(){}
	$.extend(UserListeners.prototype, Listener.prototype);

	UserListeners.prototype.listeners = [];
	UserListeners.prototype.listenUser = function(id){
		var self = this;

		database.ref('/user/' + id).on('value', function(snap){
			var data = snap.val();

			self.listeners.forEach(function(callback){
				callback(data);
			});
		});
	}


	function LikeListeners(){}
	$.extend(LikeListeners.prototype, Listener.prototype);

	LikeListeners.prototype.listeners = [];
	LikeListeners.prototype.listen = function(id){
		var self = this;

		database.ref('/like/' + id).on('value', function(snap){
			var data = snap.val();

			self.listeners.forEach(function(callback){
				callback(data);
			});
		});
	}

	function ComentariosListeners(){}
	$.extend(ComentariosListeners.prototype, Listener.prototype);

	ComentariosListeners.prototype.listeners = [];
	ComentariosListeners.prototype.listen = function(id){
		var self = this;


		database.ref('/comentarios').on('child_added', function(snap){
			var key = snap.key;
			var data = snap.val();

			self.listeners.forEach(function(callback){
				callback('child_added', key, data);
			});
		});

		database.ref('/comentarios').on('child_removed', function(snap){
			var key = snap.key;
			var data = snap.val();

			self.listeners.forEach(function(callback){
				callback('child_removed', key, data);
			});
		});
	}

	database.ref('/messages/' + login.id).on('child_added', function(snap){
		var data = snap.val();

		if(data.action == 'ping'){
			var key = Base.ref().child('/messages/' + data.user ).push().key;

			database.ref('/messages/' + data.user + '/' + key ).set({
				action: 'pong',
				user: login.id
			});
		}
	});

}(window.jQuery));

function timestampToData(timestamp){
	var data = new Date(timestamp);

	return data.getDay().padLeft(2, 0) + '/' + data.getMonth().padLeft(2, 0) + '/' + data.getFullYear() + ' ' + data.getHours().padLeft(2, 0) + ':' + data.getMinutes().padLeft(2, 0) + ':' + data.getSeconds();
}

String.prototype.nl2br = function(){
	return this.toString().replace(/\n/g, '<br />');
};


Number.prototype.padLeft = function (n,str){
    return Array(n-String(this).length+1).join(str||'0')+this;
}
