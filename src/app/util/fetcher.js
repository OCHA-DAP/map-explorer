(function(module) {

    module.service("DataFetcher", function($q, $http){

        //var hxlUrl = 'https://proxy.hxlstandard.org/data.json?url=http%3A//popstats.unhcr.org/en/demographics.hxl&select-query01-01=%23country%2Bresidence%3DSlovenia&filter01=select';
        var urlPrefix = 'https://proxy.hxlstandard.org/data.json?';
        //var genericUrl = 'url={originalUrl}&select-query01-01={selectKey}={selectValue}&filter01=select';

        var ret = {};

        ret.getData = function (originalUrl, selectKey, selectValue){
            var urlValue = encodeURIComponent(originalUrl);
            var hxlUrl = urlPrefix + 'url=' + urlValue;
            if (selectKey && selectValue) {
                var queryValue = encodeURIComponent(selectKey + "=" + selectValue);
                hxlUrl += '&select-query01-01=' + queryValue + '&filter01=select';
            }


            var deferred = $q.defer();
            $http.get(hxlUrl)
                .then(function(data){
                    deferred.resolve(data);
                    console.log(data);
                }, function(error){
                    deferred.reject(error);
                });
            //var ret = {
            //    result: "Dan e tare!"
            //};
            //deferred.reject(ret);

            return deferred.promise;
        };

        return ret;
    });

}(angular.module("hdx.map.explorer.util")));