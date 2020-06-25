const API_ENDPOINT = 'http://localhost:8080/api/v1/'

$("#getStarted").on('click', () => {
  $(".intro").css('display', 'none')
  $(".loginPanel").css('display', 'block')
})

$("#login").on('click', () => {
  login()
})

$("#closeLogin").on('click', () => {
  $(".intro").css('display', 'block')
  $(".loginPanel").css('display', 'none')
})

function login () {
  const username = $('#username').val()
  const password = $('#password').val()

  const data = { username, password }

  $.ajax(API_ENDPOINT + 'user/login', {
    type: 'POST',
    data,
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    },
    success: (user, status, xhr) => {
      localStorage.username = username
      window.location.replace('http://localhost:5050/dashboard')
    },
    error: (jqXhr, textStatus, errorMessage) => {
      Materialize.toast('Opps! Something went wrong', 3000, 'rounded')
      console.log(errorMessage);
    }
  });
}
