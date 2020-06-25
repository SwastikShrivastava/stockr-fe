const auth = {
  token: Cookies.get('token')
}

if (!auth.token) {
  window.location.replace('http://localhost:5050')
}

$(document).ready(function(){
  $('.tooltipped').tooltip({delay: 50});
  _updateSearch()
  _updateDashboard()
});

//Autocomplete
function _updateSearch () {
  $.ajax({
    type: 'GET',
    url: 'http://localhost:8080/api/v1/stocks/',
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    },
    success: function(response) {
      $('#autocomplete-input').autocomplete({
        data: response.data,
        limit: 5, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function(val) {
          const wordList = val.trim().split(' ')
          const symbol = wordList[wordList.length - 1]
          window.location.replace('http://localhost:5050/company?symbol='+symbol)
        },
      });
      Materialize.toast('Company list updated!', 3000, 'rounded')
    },
    error: (jqXhr, textStatus, errorMessage) => {
      Materialize.toast('Opps! Something went wrong', 3000, 'rounded')
      console.log(errorMessage);
    }
  });
}
// Dashboard
function _updateDashboard () {
  $.ajax({
    type: 'GET',
    url: `http://localhost:8080/api/v1/user/dashboard/${localStorage.username}`,
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    },
    success: function(response) {
      _buildWishlistChart(response.data)
      _updateStaticValues(response.data)
      Materialize.toast('Wishlist updated!', 3000, 'rounded')
      $('#pageLoader').css('display', 'none')
    },
    error: (jqXhr, textStatus, errorMessage) => {
      Materialize.toast('Opps! Something went wrong', 3000, 'rounded')
      setTimeout(_updateDashboard, 60000)
    }
  });
}

function _updateStaticValues(data) {
  const { user, transations } = data
  localStorage.balance = user.amount
  $('balance').text(user.amount)
  // update transactions
  let bought = ''
  let sold = ''

  for (let transation of transations.reverse()) {
    if (transation.type == 'BUY') {
      bought += `<li class="collection-item avatar">
      <img src="" alt="" class="circle green">
      <span class="title">${transation.symbol}</span>
      <p>Price: $ ${transation.price}<br>
      Quantity: ${transation.quantity}
      </p>
      <a href="#!" class="secondary-content"><i class="material-icons green-text">trending_down</i></a>
      </li>`
    }
    else {
      sold += `<li class="collection-item avatar">
      <img src="" alt="" class="circle red">
      <span class="title">${transation.symbol}</span>
      <p>Price: $ ${transation.price}<br>
      Quantity: ${transation.quantity}
      </p>
      <a href="#!" class="secondary-content"><i class="material-icons red-text">trending_up</i></a>
      </li>`
    }
  }

  $('stockBought').html(bought)
  $('stockSold').html(sold)
}

function _buildWishlistChart (data) {
  const { labels, fbData, googleData, appleData } = data

  var config = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        borderColor: 'white',
        fill: false,
      }]
    },
    options: {
      legend: {
        display: false
      },
      responsive: true,
      title: {
        display: false
      },
      tooltips: {
        mode: 'index',
        intersect: false,
      },
      hover: {
        mode: 'nearest',
        intersect: true
      },
      scales: {
        xAxes: [{
          display: false
        }],
        yAxes: [{
          display: true
        }]
      }
    }
  };

  var ggCtx = document.getElementById('googleChart').getContext('2d')
  var fbCtx = document.getElementById('fbChart').getContext('2d')
  var appCtx = document.getElementById('appleChart').getContext('2d')

  config.data.datasets[0].data = googleData
  window.myLine = new Chart(ggCtx, config);

  config.data.datasets[0].data = fbData
  window.myLine = new Chart(fbCtx, config);

  config.data.datasets[0].data = appleData
  window.myLine = new Chart(appCtx, config);
}
