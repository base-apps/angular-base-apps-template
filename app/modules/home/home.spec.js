import 'modules/home';

describe('HomeController', function() {
  var controller;

  beforeEach(function() {
    module('application.home');

    inject(function($controller) {
      controller = $controller('HomeController');
    });
  });

  describe('Messages', function() {

    it('should add message', function() {
      controller.submitMessage('message');

      expect(controller.messages.length).toEqual(1);
      expect(controller.messages[0]).toEqual('message');
    });
  });
});
