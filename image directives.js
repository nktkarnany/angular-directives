headerApp.directive('loadImage', ['$http', function($http){
    return{
        restrict:'A',
        scope: {
            'loadImage': '=',
            'maxWidth': '=?',
            'maxHeight': '=?',
            'scale': '=?'
        },
        link: function(scope, element, attrs){
            scope.$watch('loadImage', function(){
                var MaxWidth = 300;
                var MaxHeight = 300;
                
                var ImgSrc = scope.loadImage;
                
                if(scope.scale){
                    if($(window).width()>=991){
                        //for desktops
                        MaxWidth = 1000*(scope.scale/100);
                        MaxHeight = 1000*(scope.scale/100);
                    }else if($(window).width()<=500){
                        //for mobiles
                        MaxWidth = 650*(scope.scale/100);
                        MaxHeight = 650*(scope.scale/100);
                    }else{
                        //for tablets
                        MaxWidth = 850*(scope.scale/100);
                        MaxHeight = 850*(scope.scale/100);
                    }
                }

                if(scope.maxWidth)
                    MaxWidth = scope.maxWidth;
                if(scope.maxHeight)
                    MaxHeight = scope.maxHeight;
                
                if(ImgSrc != 'loading' && ImgSrc != '' && ImgSrc != null && ImgSrc != 'null' && ImgSrc != undefined){
                    loadImage(
                        ImgSrc,
                        function(canvas){
                            element.removeAttr('width');
                            element.removeAttr('height');
                            attrs.$set('ngSrc', canvas.toDataURL());
                        },
                        {
                            maxWidth: MaxWidth,
                            maxHeight: MaxHeight,
                            canvas: true,
                            crossOrigin: "anonymous"
                        }
                    );
                }else if(ImgSrc === '' || ImgSrc === null || ImgSrc === 'null' || ImgSrc === undefined){
                    attrs.$set('width', MaxWidth);
                    attrs.$set('height', MaxHeight);
                    attrs.$set('ngSrc', 'images/imgplaceholder.png');
                }
                
            });
        }
    }
}]);

headerApp.directive('uploadImage', ['userFactory', 'modalService', function(userFactory, modalService) {
    return {
        scope: {
            uploadImage: '=',
            uid: '@',
            id: '@'
        },
        link: function(scope, element, attrs) {
            element.bind("change", function (changeEvent) {
                
                EXIF.getData(changeEvent.target.files[0], function(){
                    exif = EXIF.getAllTags(this);
                    picOrientation = exif.Orientation;
                });
                
                var reader = new FileReader();
                reader.onload = function (loadEvent) {                   
                    loadImage(
                        loadEvent.target.result,
                        function(canvas){
                            var req = {
                                userId: userFactory.user,
                                accessToken: userFactory.userAccessToken,
                                image: canvas.toDataURL(),
                                uid: scope.uid,
                                existingLink: scope.uploadImage.link,
                                primary: false
                            }

                            scope.$apply(function () {
                                scope.uploadImage.link = "loading";
                            });

                            $.ajax({
                                url: '/SaveImageInS3',
                                type: 'post',
                                data: JSON.stringify(req),
                                contentType: "application/x-www-form-urlencoded",
                                dataType: "json",

                                success: function(response) {
                                    if(response.code == 0){
                                        scope.$apply(function () {
                                            scope.uploadImage.link = response.imageLink;
                                        });
                                    }else{
                                        scope.$apply(function () {
                                            scope.uploadImage.link = "";
                                        });
                                        modalService.showModal({}, {bodyText: response.message,showCancel: false,actionButtonText: 'Ok'}).then(function(result){
                                            if(response.code == 400)
                                                logoutService.logout();
                                        },function(){});
                                    }
                                },

                                error: function() {
                                    modalService.showModal({}, {bodyText: "Something is Wrong with the network.",showCancel: false,actionButtonText: 'Ok'}).then(function(result){},function(){});
                                }
                            });
                        },
                        {
                            maxWidth: 450,
                            maxHeight: 450,
                            canvas: true,
                            crossOrigin: "anonymous",
                            orientation: picOrientation
                        }
                    );
                    
                }
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    };
}]);

headerApp.directive('radioBtn', function () {
    return {
        restrict: 'E',
        scope: {
            value: '=',
            data: '='
        },
        controller: function ($scope) {
            $scope.checked = 0;
            $scope.value = $scope.data[0];
            $scope.checkRadio = function (index) {
                $scope.checked = index;
                $scope.value = $scope.data[index];
            }
        },
        template: '<span style="cursor: pointer;" class="icons" ng-click="checkRadio($index)" ng-repeat="d in data"><i class="fa fa-circle-o" ng-if="checked != $index"></i><i class="fa fa-dot-circle-o" ng-if="checked == $index"></i> {{d}}</span>'
    };
});

headerApp.directive('checkbox', function () {
    return {
        restrict: 'E',
        scope: {
            value: '=',
            name: '@'
        },
        controller: function ($scope) {
            $scope.changeValue = function () {
                $scope.value = !$scope.value;
            }
        },
        template: '<label style="cursor:pointer;" class="ng-class:{\'red\':value}" ng-click="changeValue()"><span class="icons"><span ng-if="!value" class="fa fa-square-o ng-class:{\'red\':value}"></span><span ng-if="value" class="fa fa-check-square-o ng-class:{\'red\':value}"></span></span>{{name}}</label>'
    };
});

headerApp.directive('checkboxList', function () {
    return {
        restrict: 'E',
        scope: {
            list: '=',
            checked: '='
        },
        controller: function ($scope) {
            $scope.list.forEach(function (l, i) {
                $scope.list[i] = {
                    name: l,
                    checked: false
                };
            });
            $scope.check = function () {
                console.log($scope.list);
            }
        },
        template: '<label class="checkbox" ng-repeat="l in list" ng-click="check()"><checkbox value="l.checked" name="{{l.name}}"></checkbox></label>'
    };
});
