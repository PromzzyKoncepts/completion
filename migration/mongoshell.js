
/**
 * ⚠️ WARNING ⚠️
 * Before executing such scripts, it is crucial to create backups to prevent accidental data loss or corruption.
 * Also, test the script on a smaller, non-production database to ensure it works as expected.
 *
 * The user schema shape has changed. This script will migrate the data to the new schema.
 * Use it before deploying to production or when you want to update the schema of an existing database.
 */

// To run this script, open mongo shell and execute the following:
// Use the correct database
// use yourDatabaseName;

// Updating the User collection to reflect the new structure of volunteer fields
/*
db.users.find({}).forEach(function(user) {
    // Migrate volunteerRejectionReason to volunteer.rejectionReason
    let volunteerRejectionReason = user.volunteerRejectionReason;

    // Migrate isVolunteer and volunteer_status to volunteer.isVolunteer and volunteer.status
    let isVolunteer = user.isVolunteer;
    let volunteer_status = user.volunteer_status;

    // Set the new volunteer field and remove the old fields
    db.users.updateOne(
        { _id: user._id },
        {
            $set: {
                "volunteer": {
                    isVolunteer: isVolunteer,
                    status: volunteer_status,
                    rejectionReason: volunteerRejectionReason
                }
            },
            $unset: {
                volunteerRejectionReason: "",
                isVolunteer: "",
                volunteer_status: ""
            }
        }
    );
});

or this one if you want to keep the old fields and their values

db.users.find({}).forEach(function(user) {
    // Migrate volunteerRejectionReason to volunteer.rejectionReason
    let volunteerRejectionReason = user.volunteerRejectionReason;
    delete user.volunteerRejectionReason;

    // Migrate isVolunteer and volunteer_status to volunteer.isVolunteer and volunteer.status
    let isVolunteer = user.isVolunteer;
    let volunteer_status = user.volunteer_status;
    delete user.isVolunteer;
    delete user.volunteer_status;

    // Set the new volunteer field
    user.volunteer = {
        isVolunteer: isVolunteer,
        status: volunteer_status,
        rejectionReason: volunteerRejectionReason
    };

    // Save the updated user document back to the database
    db.users.updateOne(
        { _id: user._id },
        { $set: user }
    );
});

*/

