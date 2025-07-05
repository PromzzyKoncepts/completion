/**
 * Authors: Arsene I. Muhire
 * Last modified: June 2022
 */
const fs = require("fs");

class DummyUsersGenerator {
  static generateUserNames(maxUserCount) {
    const userNames = [];
    for (let i = 1; i <= maxUserCount; i++) {
      userNames.push(`Test User ${i}`);
    }
    return userNames;
  }

  static generateUsers(maxUserCount = 100, counselorPrevalenceRate = 0.2) {
    // Generate users names
    const generatedUserNames =
      DummyUsersGenerator.generateUserNames(maxUserCount);
    console.info(`Generated ${generatedUserNames.length} user names`);
    const users = [];
    // Build the required user objects.
    generatedUserNames.forEach((userName) => {
      // initialize the user to be built.
      const isCounsellor = Math.random() < counselorPrevalenceRate;
      const user = {};
      user.name = userName;
      user.accountType = isCounsellor ? "counsellor" : "user";
      user.profilePicture = {
        url: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
      };
      user.isVolunteer = Math.random() < 0.3;
      user.pinnedTopics = [];
      user.email = `${userName.replace(/ /g, "").toLowerCase()}@gmail.com`;
      user.phone = {
        phone: Math.random()
          .toString()
          .split(".")[1]
          .split("")
          .splice(0, 12)
          .join(""),
        countryCode: "BC",
        callingCode: Math.floor(Math.random() * 8 + 1),
      };
      if (isCounsellor) {
        user.sessionPreferences = DummyUsersGenerator.getSessionPreferences();
      }

      users.push(user);
    });
    console.info(`All ${users.length} users generated successfully!`);
    return users;
  }
  static getWeekSessions(sessionCount) {
    // generate start and end time pairs in a day minimum 30 minutes apart
    const weekDayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];
    const weekDays = {};
    for (let s = 0; s < sessionCount; s++) {
      const pickedDay =
        weekDayNames[Math.floor(Math.random() * weekDayNames.length)];

      // initialize day array
      if (!weekDays[pickedDay]) weekDays[pickedDay] = [];

      const { sessionStartTime, sessionEndTime } =
        DummyUsersGenerator.getValidSession(weekDays[pickedDay]);
      // add session to picked day.
      weekDays[pickedDay].push({
        startTime: sessionStartTime,
        endTime: sessionEndTime,
      });
    }

    return weekDays;
  }

  static getValidSession(sessions) {
    // TODO: allow cross days sessions and test them. session starting from 11pm Monday to 1am Tuesday GMT.
    // Can be split into two session, 11pm-11:59pm Monday GMT and 0-1am tuesday GMT.

    const minutes = (Math.floor(Math.random() * 100) * 5) % 60;
    const minutes_padded = minutes < 10 ? `0${minutes}` : minutes;
    const sessionStartTime = Number(
      `${Math.floor(Math.random() * 22)}${minutes_padded}`
    );
    // 2hr or 1hr session
    let sessionEndTime = sessionStartTime + (Math.random() < 0.5 ? 200 : 100);
    // this line avoids incorrect time notation. 2400 => 0
    if (sessionEndTime >= 2400) sessionEndTime = 2359;

    if (sessions.length) {
      for (let indexInner = 0; indexInner < sessions.length; indexInner++) {
        if (
          !(
            (sessionStartTime < sessions[indexInner].startTime &&
              sessionEndTime < sessions[indexInner].startTime) ||
            (sessionStartTime > sessions[indexInner].endTime &&
              sessionEndTime > sessions[indexInner].endTime)
          )
        ) {
          return DummyUsersGenerator.getValidSession(sessions);
        }
      }
    }

    return {
      sessionStartTime,
      sessionEndTime,
    };
  }

  static getSessionPreferences() {
    const sessionPreferences = {};
    // TODO: Change the genders to sth reasonable, replace both with any or add non-binary.
    const genders = ["male", "female", "both"];
    sessionPreferences.workDays = DummyUsersGenerator.getWeekSessions(
      Math.ceil(Math.random() * 10)
    );
    sessionPreferences.gender =
      genders[Math.floor(Math.random() * genders.length)];
    sessionPreferences.preferredFields = [];
    PREFERRED_FIELDS_OBJECT_IDS.forEach((id) =>
      sessionPreferences.preferredFields.push({
        $oid: id,
      })
    );
    return sessionPreferences;
  }
}

// TODO: Change based on staging database available session category ObjectIds
const PREFERRED_FIELDS_OBJECT_IDS = [
  "604524be7abb765195d3e91d",
  "6045243d7abb765195d3e91b",
];
const users = DummyUsersGenerator.generateUsers(1000);
const usersJSON = JSON.stringify(users);
const usersFilePath = `${__dirname}/generated/users_${Date.now()}.json`;
fs.writeFile(usersFilePath, usersJSON, "utf8", () =>
  console.info("Users saved successfully!", usersFilePath)
);
