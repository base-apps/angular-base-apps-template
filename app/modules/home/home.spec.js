import 'modules/home';

describe('HomeController', () => {
  var controller;

  beforeEach(() => {
    module('application.home');

    inject(($controller) => {
      controller = $controller('HomeController');
    });
  });

  describe('Messages', () => {

    it('should add message', () => {
      controller.submitMessage('message');

      expect(controller.messages.length).toEqual(1);
      expect(controller.messages[0]).toEqual('message');
    });
  });
});
