var socket = io();
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//declare a global for our playlist
var clickedSong;

//doesn't allow users to interact w/ submissions until "signed in"
$('#chatForm').hide();
$('#room').hide();
$('#name').focus();
$('#player').hide();
$('#playerControls').hide();
// $('#url').prop('disabled',true);
// $('#urlSub').prop('disabled',true);

$('#search-results').click(function(event) {
  var idVal = $(event.target).parent().attr('id');
  socket.emit('url submit', idVal);

  clickedSong = $(event.target).parent();
});

function urlInjectFunc(url){
  socket.emit('url submit', url);
}

socket.on('url submit', function(url){
  $('#player').remove();
  $('.videoPlayer').append('<div id="player">');
  // set timeOut for playing new video
  $('#disable-functionality').addClass('disableDiv');
  setTimeout(function() {
   $('#disable-functionality').removeClass('disableDiv');
  }, 3500);
});

//save to playlist
$('#saveToPlaylist').on('click', function() {
  var songId = clickedSong.attr('id');
  var alreadySavedSongs = $('#saved-results').children().attr('id');
  console.log('songId', songId);
  console.log('alreadySavedSongs', alreadySavedSongs);
  
  //check if clickedSong exists in playlist
  if(songId !== alreadySavedSongs){
    var playlistEntry =$('<p id="' + clickedSong.attr('id') + '"><img src="' + clickedSong.context.src +'" height="70"></p>').hide().fadeIn(4000);
    $('#saved-results').append(playlistEntry);
    return;
  } else {
    alert('You\'ve already saved that song. Silly.');
  }
}); 

//delete from playlist
// $('#removeFromPlaylist').on('click', function() {  
//   var songId = clickedSong.attr('id');
//   var alreadySavedSongs = $('#saved-results').children().attr('id');
//   if(songId === alreadySavedSongs){
//     // console.log('songId', songId);
//     $('<div id="' + alreadySavedSongs+ '">').remove();
//     console.log('alreadySavedSongs', $('div[id="'+ alreadySavedSongs +'"]'));
//     console.log('alreadySavedSongs', $('<div id="' + alreadySavedSongs+ '">'));
//     // $('#saved-results').children().attr('id').remove();
//   }
// });


$('#saved-results').click(function(event) {
  var idVal = $(event.target).parent().attr('id');
  socket.emit('url submit', idVal);
  clickedSong = $(event.target).parent();
});

socket.on('url submit', function(idVal){
  $('#player').remove();
  $('.videoPlayer').append('<div id="player">');
  var player = new YT.Player('player', {
    videoId : idVal,
    playerVars: { 
      'autoplay': 0, 
      'controls': 0, 
      'disablekb': 0
    }
  });
  socket.player = player;
  socket.url = idVal;
  // console.log(player);
});

//play video event
$('#playVid').on('click', function() {
  socket.emit('play video');
});

socket.on('play video', function(){
  socket.player.playVideo();
});

//pause video event
$('#pauseVid').on('click', function() {
  socket.emit('pause video');
});

socket.on('pause video', function() {
  socket.player.pauseVideo();
});

socket.on('new connection', function () {
//this occurs before new player;
  if(!socket.player){
    return;
  }
  socket.emit('new connection res', {
    url: socket.url,
    time: socket.player.getCurrentTime()
  });
});

socket.on('new connection res', function(obj) {
  var time = Math.floor(obj.time); 
  console.log(time);
  setTimeout( 
    function(){
      var player = new YT.Player('player', { 
        videoId: obj.url,
        playerVars: { 
          'start': time,
          'autoplay' : 1,
          'controls' : 0
        } 
      });
      if(!socket.player) {
        socket.player = player;
      }
    },100);
});

// BEGIN CHAT CONTROLS
//--------------

//emit message to other sockets
$('#chatForm').submit(function() {
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});

// join the server upon submitting a username
$('#join').click(function() {
  var name = $('#name').val();
  if (name != '') {
    socket.emit('join', name);
    ready = true;
    $('#chatForm').show();
    $('#room').show();
    $('#m').focus();
    $('#player').show();
    $('#playerControls').show();
    $('#joinChat').hide();
    $('#url').prop('disabled',false);
    $('#urlSub').prop('disabled',false);
  }
});

$('#name').keypress(function(e) {
  if (e.which == 13) {
    //e.which is the keynumber
    var name = $('#name').val();
    if (name != '') {
      socket.emit('join', name);
      ready = true;
      $('#chatForm').show();
      $('#room').show();
      $('#m').focus();
      $('#player').show();
      $('#playerControls').show();
      $('#joinChat').hide();
      $('#url').prop('disabled',false);
      $('#urlSub').prop('disabled',false);
      return false;
    }
  }
});

// update notice informing local user of join (only shown to local user)
socket.on('update', function(msg) {
  if (ready) {
    $('#messages').append($('<li>').text(msg));
  }
});

// update notice informing remote user of join/leave (shown to all users)
socket.on('update-people', function(people) {
  if (ready) {
    $('#people').empty();
    $.each(people, function(clientid,name) {
      $('#people').append($('<li>').text(name));
    });
  }
});

//on event, add messages to chat box
socket.on('chat message', function(who,msg) {
  if (ready) {
    var linkifiedMsg = anchorme.js(msg,{"class":"urlInject"});
    var start = msg.indexOf('www.youtube.com/watch?v=')+24;

    if(start){
      var youtubeUrlId = msg.substr(start, 11);
    }

    $('#messages').append($('<li>').html('<strong>' + who + ': ' + '</strong>' + linkifiedMsg));
    var findHref = $('li').last().children().first().next().attr('class');
    
    $('.'+findHref).click(function(e){
      e.preventDefault();
      this.href = urlInjectFunc(youtubeUrlId);
    });
  }
});

// Autoscroll chat
window.setInterval(function() {
  var elem = document.getElementById('messages');
  elem.scrollTop = elem.scrollHeight;
}, 5000);
