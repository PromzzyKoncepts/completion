const { JoiRequestBodyValidator } = require("./joiValidator");
const Joi = require("joi");

exports.validateProfilePicture = JoiRequestBodyValidator(
Joi.object({
    profilePicture: Joi.string(),
    }).min(1)
    .unknown(false)
);

exports.validateUpdateNotificationSettings = JoiRequestBodyValidator(
    Joi.object({
        pushConvoEngagement: Joi.boolean(),
        emailConvoEngagement: Joi.boolean(),
        pushNewConvo: Joi.boolean(),
        emailNewConvo: Joi.boolean(),
        pushRescheduleRequest: Joi.boolean(),
        emailRescheduleRequest: Joi.boolean(),
        commentReplies: Joi.boolean(),
    })
        .min(1)  // Ensures that at least one field is required
        .unknown(false)  // Disallows extra fields not defined in the schema
);


exports.validateUpdatePrivacySettings = JoiRequestBodyValidator(
    Joi.object({
        showName: Joi.boolean(),
        showProfilePic: Joi.boolean(),
        showMoodChart: Joi.boolean(),
    })
        .min(1)  // Ensures that at least one field is required
        .unknown(false)  // Disallows extra fields not defined in the schema
);

exports.validateUpdateMe = JoiRequestBodyValidator(
    Joi.object({
        firstName: Joi.string().max(100),
        lastName: Joi.string().max(100),
        dateOfBirth: Joi.date(),
        gender: Joi.string(),
        profilePicture: Joi.string(),
        countryOfResidence: Joi.string(),
        cityOfResidence: Joi.string(),
        pushToken: Joi.string(),
        certificates: Joi.array().items(Joi.string()),
        mentalHealthCertificates: Joi.array().items(Joi.string()),
        motivation: Joi.string(),
        notificationSettings: Joi.object(),
        username: Joi.string(),
        email: Joi.string().email(),
        phoneNumber: Joi.string(),
        pinnedTopics: Joi.array().items(Joi.string()),
        sessionPreferences: Joi.object(),
    })
        .min(1)
        .unknown(false)
);

exports.validateServiceUserProfileSetup = JoiRequestBodyValidator(
    Joi.object({
        birthday: Joi.date().max("now"),
        gender: Joi.string().valid("male", "female", "other","non-binary", "prefer not to say"),
        accountPrivacy: Joi.string().valid("public", "private"),
        turnOnNotification: Joi.boolean(),
        nationality: Joi.string(),
        username: Joi.string(),
        city: Joi.string(),
        interestedTopics: Joi.array().items(Joi.string()),
        profilePicture: Joi.object({
            url: Joi.string().uri().required(),       // URL validation
            reference: Joi.string().required(),  // Reference validation
        }),
    })
        .min(1)
        .unknown(false)
);

exports.validateCounsellorProfileSetup = JoiRequestBodyValidator(
    Joi.object({
        birthday: Joi.date().max("now"),
        gender: Joi.string().valid("male", "female", "other"),
        username: Joi.string().max(100),
        accountPrivacy: Joi.string().valid("public", "private"),
        turnOnNotification: Joi.boolean(),
        nationality: Joi.string(),
        bio: Joi.string(),
        city: Joi.string(),
        focusArea: Joi.array().items(Joi.string()),
        specialty: Joi.array().items(Joi.string()),
        interestedTopics: Joi.array().items(Joi.string()),
        profilePicture: Joi.object({
            url: Joi.string().uri().required(),       // URL validation
            reference: Joi.string().required(),       // Reference validation
        }),
        qualifications: Joi.array().items(
            Joi.object({
                url: Joi.string().uri().required(),   // URL validation
                reference: Joi.string().required(),
            })
        ),
        commencePractice: Joi.number().integer().min(1900).max(new Date().getFullYear()),  // Year validation
    })
        .min(1)
        .unknown(false)
);

exports.validateCounsellorInfo = JoiRequestBodyValidator(
    Joi.object({
        bio: Joi.string().min(50).max(100).required(),  // Bio validation

        schedule: Joi.array().items(
            Joi.object({
                dayOfWeek: Joi.string().valid(
                    "Monday", "Tuesday", "Wednesday",
                    "Thursday", "Friday", "Saturday", "Sunday"
                ).required(),
                availability: Joi.object({
                    from: Joi.string()
                        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
                        .required(),  // Time in HH:mm format
                    to: Joi.string()
                        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
                        .required()    // Time in HH:mm format
                }),
            })
        ).min(1),

        sessionType: Joi.array().items(Joi.string().valid("video", "call", "video and call")).min(1),

        specializedSupport: Joi.array().items(
            Joi.string().valid(
                "Women Only issues", "Men Only issues",
                "LGBTQ+ specialist", "Non-Religious", "Religious"
            )
        ).min(1),

        focusArea: Joi.array().items(Joi.string()).min(1),  // Validating focusArea as an array of strings

        commencePractice: Joi.string()
            .regex(/^\d{4}$/) // Regex to ensure the year is a 4-digit number
            .optional()       // Not required
            .messages({
                "string.pattern.base": "Commence Practice must be a valid year (e.g., 1990)"
            })

    }).min(1).unknown(false)
);

exports.validateCounsellorSch = JoiRequestBodyValidator(
    Joi.object({
        

        schedule: Joi.array().items(
            Joi.object({
                dayOfWeek: Joi.string().valid(
                    "Monday", "Tuesday", "Wednesday",
                    "Thursday", "Friday", "Saturday", "Sunday"
                ).required(),
                availability: Joi.array().items(Joi.object({
                    from: Joi.string()
                        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
                        .required(),  // Time in HH:mm format
                    to: Joi.string()
                        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
                        .required()    // Time in HH:mm format
                })),
            })
        ).min(1),

        
    }).min(1).unknown(false)
);
// exports.validateCouncellorInfo = JoiRequestBodyValidator(
//     Joi.object({
//         bio: Joi.string().min(50).max(100),  // Bio validation
//         schedule: Joi.array().items(
//             Joi.object({
//                 dayOfWeek: Joi.string().valid(
//                     "Monday", "Tuesday", "Wednesday",
//                     "Thursday", "Friday", "Saturday", "Sunday"
//                 ).required(),
//                 from: Joi.string()
//                     .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
//                     .required(),  // Time in HH:mm format
//                 to: Joi.string()
//                     .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
//                     .required()    // Time in HH:mm format
//                     .custom((value, helpers) => {
//                         const { from } = helpers.state.ancestors[0];
//                         if (from && value <= from) {
//                             return helpers.message('"to" time must be later than "from" time');
//                         }
//                         return value;
//                     }),
//             })
//         ),
//         sessionType: Joi.array().items(Joi.string().valid("video", "call", "video and call")).min(1),
//         specializedSupport: Joi.array().items(
//             Joi.string().valid(
//                 "Women Only issues", "Men Only issues",
//                 "LGBTQ+ specialist", "Non-Religious", "Religious"
//             )
//         ).min(1),
//         focusArea: Joi.array().items(Joi.string()).min(1),  // Validating focusArea as an array of strings
//     })
//         .min(1)
//         .unknown(false)
// );




exports.validateVerifyEmail = JoiRequestBodyValidator(
    Joi.object({
        code: Joi.string().required(),
    }).unknown(false)
);

exports.validateVerifyPhoneNumber = JoiRequestBodyValidator(
    Joi.object({
        code: Joi.number().required(),
    }).unknown(false)
);

exports.validateUpgradeToLeaderOrReject = JoiRequestBodyValidator(
    Joi.object({
        accountType: Joi.string()
            .required()
            .valid(
                "volunteer",
                "rejected volunteer",
                "counsellor",
                "rejected counsellor"
            ),
        rejectionReason: Joi.string().optional(),
        // FIXME: this is not working
        // rejectionReason: Joi.when("accountType", {
        //     is: Joi.string().valid("rejected volunteer", "rejected counsellor"),
        //     then: Joi.string().required(),
        //     otherwise: Joi.string().optional(),
        // }),
    }).unknown(false)
);
