
var AylienNewsApi = require('aylien-news-api');

var apiInstance = new AylienNewsApi.DefaultApi();

// Configure API key authorization: app_id
var app_id = apiInstance.apiClient.authentications['app_id'];
app_id.apiKey = "270a22ef";

// Configure API key authorization: app_key
var app_key = apiInstance.apiClient.authentications['app_key'];
app_key.apiKey = "d020e5ad98503954f30886b9fc7fe9cb";

var keyword = 'spotify'; // the company the user is following

function get_news(keyword) {
    var opts = {
        'title': keyword,
        'sortBy': 'published_at',
        'language': ['en'],
        'notLanguage': ['es', 'it'],
        'publishedAtStart': 'NOW-7DAYS',
        'publishedAtEnd': 'NOW', 
        'entitiesTitleType': ["Company", "Organization"]
      };
      
      var callback = function(error, data, response) {
        if (error) {
          console.error(error);
        } else {
          console.log('API called successfully. Returned data: ');
          console.log('========================================');
          for (var i = 0; i < data.stories.length; i++){
            console.log(data.stories[i].title + " / " + data.stories[i].source.name);
          }
        }
      };
      apiInstance.listStories(opts, callback);
}

get_news(keyword);