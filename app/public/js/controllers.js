var socket = io('http://localhost:3000');
var sshApp = angular.module('sshTerminal', ['ngMaterial', 'ngMdIcons']);
sshApp.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .dark();
});
sshApp.directive('schrollBottom', function () {
  return {
    scope: {
      schrollBottom: "="
    },
    link: function (scope, element) {
      scope.$watchCollection('schrollBottom', function (newValue) {
        if (newValue)
        {
          element[0].scrollTop = element[0].scrollHeight;
        }
      });
    }
  }
})
sshApp.controller('TerminalController', function($scope, $mdDialog, $mdMedia) {
  $scope.output = [];
  $scope.sendCommand = function() {
    $scope.output.push($scope.settings.username + "@" + $scope.settings.host + "# " + $scope.command);
    socket.emit('command', $scope.command);
    $scope.command = "";
  };
  $scope.saveSettings = function() {
    socket.emit('settings', $scope.settings);
    $scope.$apply();
  };
  socket.on('output', function (data) {
    console.log(data);
    $scope.output = $scope.output.concat(data.split("\n"));
    $scope.$apply();
  });
  socket.on('settings', function (data){
    console.log(data);
    $scope.settings = data;
    $scope.$apply();
  });
  $scope.showAdvanced = showAdvanced;
  function showAdvanced(ev) {
    var useFullScreen = false;
    $mdDialog.show({
      controller: SettingsController,
      templateUrl: 'settings.tmpl.html',
      locals: { settings: $scope.settings },
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:false,
      fullscreen: useFullScreen
    })
    .then(function(close) {
      console.log(close);
    }, function() {
      console.log("cancelled");
    });
  };
});
function SettingsController($scope, $mdDialog, settings) {
  $scope.oldSettings = JSON.stringify(settings);
  $scope.settings = settings;
  $scope.saveSettings = function() {
    socket.emit('settings', $scope.settings);
  };
  $scope.cancelSettings = function() {
    if (JSON.stringify($scope.settings) != $scope.oldSettings){
      $scope.settings = JSON.parse($scope.oldSettings);
      $scope.saveSettings();
    }
  }
  $scope.hide = function() {
    console.log("hide");
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    console.log("cancel");
    $scope.cancelSettings();
    $mdDialog.hide('cancel');
  };
  $scope.close = function(close) {
    console.log(close);
    switch (close) {
      case "save":
        $scope.saveSettings();
        $mdDialog.hide('save');
        break;
      case "cancel":
        $scope.cancelSettings();
        $mdDialog.hide('cancel');
        break;
      default:
        console.log(close);
    }
  };
}
