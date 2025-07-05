const Session = require("../../../models/v1/Session");
const User = require("../../../models/v1/User");
const dayjs = require("dayjs");
const lodash = require("lodash");
const { getDates } = require("../../../utils/arrayFromDate");

class DashboardController {
    static async fetchDashboard(req, res) {
        const { period = "month" } = req.params;
        const query = {
            endTime: { $gte: dayjs().startOf(period).format() },
        };
        const sessionCount = await Session.count({});
        const newUsers = await User.count({});
        const activeCounsellors = await User.count({
            accountType: "counsellor",
            active: true,
        });
        const dashboard = await Session.find(query).select("startTime").lean();
        const dateArray = getDates(
            dayjs().startOf(period).valueOf(),
            dayjs(new Date()).startOf("day").valueOf()
        );
        const graphData = dateArray.map((date) => ({
            x: dayjs(date)
                .startOf("day")
                .format(period === "week" ? "MMMM DD" : "MMMM DD"),
            y: dashboard.reduce((accumulator, currentValue) => {
                return dayjs(new Date(currentValue.startTime))
                    .startOf("day")
                    .format("YYYY MMMM DD hh:mm") ===
                    dayjs(date).startOf("day").format("YYYY MMMM DD hh:mm")
                    ? accumulator + 1
                    : accumulator;
            }, 0),
        }));

        return res.send({
            status: "success",
            data: {
                totalSessions: sessionCount,
                newUsers: newUsers,
                activeCounsellors: activeCounsellors,
                dashboard: graphData,
            },
        });
    }
}

module.exports = { DashboardController };
