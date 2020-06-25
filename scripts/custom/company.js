const auth = {
  token: Cookies.get('token')
}

$.urlParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)')
  .exec(window.location.search);

  return (results !== null) ? results[1] || 0 : false;
}

const SYMBOL = $.urlParam('symbol')

if (!auth.token || !SYMBOL || !SYMBOL.length) {
  window.location.replace('http://localhost:5050')
}

$(document).ready(function() {
  // global initialisation
  Materialize.updateTextFields();
  $('.tooltipped').tooltip({delay: 50});
  $('.modal').modal();
  //Autocomplete
  $(function() {
    _updateSearch()
    _updateCompanyData()
    $('balance').text(localStorage.balance)
  });

  setInterval(() => {
    _updateSearch()
    _updateCompanyData()
  }, 180000)

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

  function _updateCompanyData () {
    $.ajax({
      type: 'GET',
      url: `http://localhost:8080/api/v1/stocks/${SYMBOL}`,
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        _renderCompanyDetails(response.data)
        Materialize.toast('Company Details updated!', 3000, 'rounded')
      },
      error: (jqXhr, textStatus, errorMessage) => {
        Materialize.toast('Opps! Something went wrong', 3000, 'rounded')
        console.log(errorMessage);
      }
    });
  }

  function _renderCompanyDetails (data) {
    _renderStocksGraph (data)
    _renderNewsSenti (data.newsSentiments)
    _renderBasicDetails (data.basicDetails)
    _renderNewsData (data.newsData)
    $('#pageLoader').css('display', 'none')
  }

  function _renderNewsData (data) {
    let newsData = ''
    for (let news of data) {
      newsData += `<h6><strong>${news.headline}</strong></h6>
      <p>${news.summary}</p>
      <div class="center"><a href="${news.url}" class="btn-flat blue-text" target="_blank">Read More</a><hr><br></div>`
    }

    $('news').html(newsData)
  }

  function _renderBasicDetails (data) {
    $('#comLogo').attr('src', data.logo)
    $('#comSector').text(data.sector)
    $('#comName').text(data.name)
    $('ipo').text(data.ipo)
    $('marcap').text(data.marketCap)
    $('outstand').text(data.outstanding)
  }

  function _renderNewsSenti (data) {
    var config = {
      type: 'pie',
      data: {
        datasets: [{
          data: [
            data.sentiment.bearishPercent,
            data.sentiment.bullishPercent
          ],
          backgroundColor: [ 'red', 'green' ]
        }],
        labels: [ 'Bearish', 'Bullish' ]
      },
      options: {
        responsive: true,
        legend: {
          labels: {
            fontColor: "white",
            fontSize: 14
          }
        }
      }
    };

    var ctx = document.getElementById('newSentiChart').getContext('2d');
    window.myPie = new Chart(ctx, config);
    console.log(data.sentiment.bearishPercent);
    if (Number(data.sentiment.bearishPercent) > 0.5) {
      $('growthOrFall').text('Fall')
    } else {
      $('growthOrFall').text('Growth')
    }

    $('newsScore').text(Math.round(data.newsScore*100) + '%')
  }

  function _renderStocksGraph (data) {
    const { stockPrice } = data
    // set Current value
    $('cv').text(stockPrice.timeSeries[stockPrice.timeSeries.length-1])

    // build graph
    var stocksCtx = document.getElementById('stocksChart').getContext('2d')
    var gradientFill = stocksCtx.createLinearGradient(500, 0, 100, 0);
    gradientFill.addColorStop(0, "rgba(128, 182, 244, 0.6)");
    gradientFill.addColorStop(1, "rgba(244, 144, 128, 0.6)");

    var config = {
      type: 'line',
      data: {
        labels: stockPrice.labelsTS,
        datasets: [{
          borderColor: gradientFill,
          pointBorderColor: gradientFill,
          pointBackgroundColor: gradientFill,
          pointHoverBackgroundColor: gradientFill,
          pointHoverBorderColor: gradientFill,
          fill: true,
          backgroundColor: gradientFill
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

    config.data.datasets[0].data = stockPrice.timeSeries
    window.myLine = new Chart(stocksCtx, config);
  }
});

$(".initSale").on('click', () => {
  getQuote()
})

$("#buyStock").on('click', () => {
  buyStock()
})

$("#sellStock").on('click', () => {
  sellStock()
})

function buyStock() {
  $.ajax({
    type: 'POST',
    url: `http://localhost:8080/api/v1/stocks/buy/${SYMBOL}`,
    data: {
      username: localStorage.username,
      quantity: $('#quantity').val()
    },
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    },
    success: function(response) {
      localStorage.balance = response.data.updatedAmount
      $('balance').text(response.data.updatedAmount)
      Materialize.toast(`Stocks Bought! Txn Id: ${response.data.txnId}`, 2000, 'rounded')
    },
    error: (jqXhr, textStatus, errorMessage) => {
      Materialize.toast('Opps! Something went wrong', 3000, 'rounded')
      console.log(errorMessage);
    }
  });
}

function sellStock() {
  $.ajax({
    type: 'POST',
    url: `http://localhost:8080/api/v1/stocks/sell/${SYMBOL}`,
    data: {
      username: localStorage.username,
      quantity: $('#quantitys').val()
    },
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    },
    success: function(response) {
      localStorage.balance = response.data.updatedAmount
      $('balance').text(response.data.updatedAmount)
      Materialize.toast(`Stocks Sold! Txn Id: ${response.data.txnId}`, 2000, 'rounded')
    },
    error: (jqXhr, textStatus, errorMessage) => {
      Materialize.toast('Not enough stocks', 3000, 'rounded')
      console.log(errorMessage);
    }
  });
}

function getQuote() {
  $.ajax({
    type: 'GET',
    url: `http://localhost:8080/api/v1/stocks/quote/${SYMBOL}`,
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    },
    success: function(response) {
      $('lowRate').text(response.data.low)
      $('highRate').text(response.data.high)
      $('price').text(response.data.price)
      Materialize.toast('Quote fetched!', 2000, 'rounded')
    },
    error: (jqXhr, textStatus, errorMessage) => {
      Materialize.toast('Opps! Something went wrong', 3000, 'rounded')
      console.log(errorMessage);
    }
  });
}
