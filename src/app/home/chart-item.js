(function(module) {
    module.directive("chartItem", function($q, DataFetcher){
        return {
            restrict: "E",
            scope: {
                chartId: '=',
                data: '=',
                url: '=',
                type: '='
            },
            link: function($scope, element, attrs, controller){
                var charts = $scope.data;
                var chartWrapperClass = $scope.chartWrapperClass = "chart-item-wrapper";
                if (charts.length > 0) {
                    $scope.hasMoreCharts = charts.length > 1;
                    $scope.selectedChart = charts[0];
                    createChart($scope.url, $scope.selectedChart);
                }

                function createChart(url, chartData) {
                    var chartId = '#' + $scope.chartId;
                    console.log("Dimensions for " + chartId + " are - W " + $(chartId).width() + ", H " + $(chartId).height());
                    var chartWrapperEls = $("." + chartWrapperClass);
                    var chartSize = null;
                    if (chartWrapperEls.length > 0 && chartWrapperEls[0].id != $scope.chartId ) {
                        chartSize = {
                            width: $(chartWrapperEls[0]).width(),
                            height: $(chartWrapperEls[0]).height()
                        };
                        console.log(" using size " + JSON.stringify(chartSize) + " for item " + chartId);
                    }
                    $scope.appliedFilters = "";
                    if ($scope.chart) {
                        $scope.chart.destroy();
                    }
                    var promise = DataFetcher.fetchData(url, chartData);
                    promise.then(function (result) {
                        var usableData = result.data.slice(1);
                        var options = $.extend(true, $scope.selectedChart.options, {
                            bindto: chartId,
                            axis: {
                                x: {
                                    tick: {
                                        rotate: 45
                                    }
                                },
                                y: {
                                    tick: {
                                        values: decideChartValues(usableData, 4)
                                    }
                                }

                            },
                            padding: {
                                left: 55,
                                right: 20
                            },
                            size: chartSize,
                            color: {
                                pattern: [decideChartColor(charts.colors)]
                            },
                            data: {
                                rows: usableData,
                                onclick: function (d, element) {
                                    var additionalFilters = [
                                        {
                                            'type': 'select',
                                            'options': {
                                                'column': chartData.options.data.x,
                                                'operator': '=',
                                                'value': usableData[d.index + 1][0]
                                            }
                                        }
                                    ];
                                    $scope.$emit("chartPointClicked", additionalFilters);
                                }
                            },
                            onresized: function () {
                                $scope.chart.destroy();
                                $(chartId).removeAttr( 'style' );
                                setTimeout(function(){
                                    // console.log("resized - Dimensions for " + chartId + " are - W " + $(chartId).width() + ", H " + $(chartId).height());
                                    options.size = null;
                                    $scope.chart = c3.generate(options);
                                }, 200);
                            }
                        });

                        $scope.chart = c3.generate(options);
                    }, dataError);

                }

                function changeChartData (url, chartData, additionalFilters) {
                    var deferred = $q.defer();
                    var chart = $scope.chart;
                    DataFetcher.fetchData(url, chartData, additionalFilters).then(function (result) {
                            var data = result.data;
                            if (data.length <= 2) {
                                chart.unload();
                            } else {
                                chart.load({
                                    rows: data.slice(1)
                                });
                            }
                            deferred.resolve(additionalFilters);
                        });

                    return deferred.promise;
                }

                $scope.onChangeCharts = function (index) {
                    $scope.selectedChart = charts[index];
                    createChart($scope.url, $scope.selectedChart);

                };

                $scope.$on("layerSelect", function(event, data){
                    if ($scope.chart){
                        changeChartData($scope.url, $scope.selectedChart, data).then(function(additionalFilters) {
                            var appliedFilters = "";
                            angular.forEach(additionalFilters, function (item) {
                                console.log(JSON.stringify(item));
                                appliedFilters += item.options.value + ",";
                            });
                            $scope.appliedFilters = appliedFilters.substring(0, appliedFilters.length - 1);
                        });
                    }
                });
            },
            templateUrl: "home/chart-item.tpl.html"
        };
    });

    function dataError(error) {
        console.error(error);
    }

    function decideChartColor(colorList) {
        if (colorList.length > 0) {
            var index = Math.floor(colorList.length / 2);
            return colorList[index];
        }
        else {
            return null;
        }
    }

    function decideChartValues(usableData, numOfTicks){
        var maxValue = findMaxValue(usableData);
        var step = Math.round(maxValue / numOfTicks);
        var roundedStep = computeRoundedStep(step);

        console.log("Step " + step + "; roundedStep  " + roundedStep);

        var values = [];
        var value = roundedStep;
        while (value < maxValue) {
            values.push(value);
            value += roundedStep;
        }
        values.push(value);

        function findMaxValue(dataList) {
            var max = 0;
            for (var i=0; i<dataList.length; i++) {
                var value = dataList[i][1];
                max = value > max ? value : max;
            }
            return max;
        }

        function computeRoundedStep(step) {
            var roundUpConfig = [
                {limit: 100, rounding: 10},
                {limit: 1000, rounding: 10},
                {limit: 10000, rounding: 100},
                {limit: 100000, rounding: 1000},
                {limit: 1000000, rounding: 10000}
            ];
            var rounding = 10000;
            for (var i = 0; i < roundUpConfig.length; i++) {
                var configItem = roundUpConfig[i];
                if (configItem.limit > step) {
                    rounding = configItem.rounding;
                    break;
                }
            }
            return Math.ceil(step / rounding) * rounding;
        }

        return values;

    }

}(angular.module("hdx.map.explorer.home")));