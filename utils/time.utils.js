class Time {
  constructor(time) {
    Time.validate(time); // throws error on invalid input.
    if (typeof time === "string") {
      this.timeStr = time;
      this.timeInt = this._getTimeInt();
    } else {
      this.timeInt = time;
      this.timeStr = this._getTimeString();
    }
  }
  zeroPad(num, places) {
    return String(num).padStart(places, "0");
  }

  _getTimeString() {
    if (this.timeInt < 10) return `00:0${this.timeInt}`;
    const numericTimeString = this.timeInt.toString();
    const matchObj = numericTimeString.match(/(\d*)(\d{2})/);
    if (!matchObj) throw Error("Invalid time notation. Should be hhmm");
    this.hours = Number(matchObj[1]);
    this.minutes = Number(matchObj[2]);
    if (this.hours > 23) throw Error("Hours value cannot exceed 23.");
    if (this.minutes > 59) throw Error("Minutes value cannot exceed 59.");
    return `${this.zeroPad(this.hours, 2)}:${this.minutes}`;
  }

  _getTimeInt() {
    const matchObj = this.timeStr.match(/(\d*):(\d{2})/);
    if (!matchObj) throw Error("Invalid time notation. Should be hh:mm");
    this.hours = Number(matchObj[1]);
    this.minutes = Number(matchObj[2]);
    if (this.hours > 23) throw Error("Hours value cannot exceed 23.");
    if (this.minutes > 59) throw Error("Minutes value cannot exceed 59.");

    return Number(
      `${this.zeroPad(this.hours, 2)}${this.zeroPad(this.minutes, 2)}`
    );
  }
  addMinutes(minutesToAdd) {
    const newMinutes = this.minutes + minutesToAdd;
    const remainder = newMinutes % 60;
    this.minutes = remainder;
    const newHours = this.hours + Math.floor(newMinutes / 60);
    // TODO: Hack. Should be changed after handling multi UTC-Days request issue.
    if (newHours > 23) {
      this.hours = 23;
      this.minutes = 59;
    } else {
      this.hours = newHours;
    }
    this.timeStr = `${this.zeroPad(this.hours, 2)}:${this.zeroPad(
      this.minutes,
      2
    )}`;
    this.timeInt = Number(
      `${this.zeroPad(this.hours, 2)}${this.zeroPad(this.minutes, 2)}`
    );
  }
  static validate(time) {
    if (typeof time == "string" && /^(\d*):(\d{2})$/.test(time)) return;
    if (typeof time == "number" && /(\d*)*(\d{1,2})/.test(time.toString()))
      return;
    throw Error(
      "Invalid time input. Should be type Number hhmm or String hh:mm."
    );
  }
}

module.exports = {
  Time,
};
