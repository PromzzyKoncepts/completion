const sgMail = require("@sendgrid/mail");
const asyncHandler = require("../middlewares/asyncHandler");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class MailNotificationService {
    static sendMail = asyncHandler(
        async ({
            sender = process.env.SUPPORT_EMAIL,
            recipient,
            dynamic_template_data = {},
            templateId,
            html,
            subject = "New Mail",
        }) => {
            const msg = {
                to: recipient,
                from: {
                    email: sender,
                    name: "Positiveo Support",
                },
                subject: subject,
                dynamic_template_data,
                templateId,
            };

            if (html) {
                delete msg.dynamic_template_data;
                msg.html = html;
            }

            try {
                await sgMail.send(msg);
            } catch (error) {
                if (error.response) {
                    throw new Error(JSON.stringify(error.response.body));
                }
                throw error;
            }
        }
    );
}

module.exports = MailNotificationService;
