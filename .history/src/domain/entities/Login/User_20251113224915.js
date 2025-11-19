export class User {
  constructor({ userid, username, email, password, role, isactive }) {
    this.userid = userid;
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role;
    this.isactive = isactive;
  }
}
