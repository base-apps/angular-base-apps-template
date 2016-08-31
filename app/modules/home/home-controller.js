export default class HomeController {
  constructor() {
    this.messages = [];
    return this;
  }

  submitMessage(message) {
    this.messages.push(message);
  }
}
