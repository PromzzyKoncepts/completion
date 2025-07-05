const mongoose = require("mongoose");
const User = require("../../models/v2/Base");
const Media = require("../../models/v2/Media");
const Session = require("../../models/v2/Session");
const ApiResponse = require("../../utils/ApiResponse");

/**
 * @description Get Counsellor Gender analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getGender = async (req, res) => {
    try {
        const { accountType } = req.params;

        if (!accountType) {
            return ApiResponse.failure(res, "accountType is required");
        }

        const allowedAccountTypes = ["serviceuser", "counsellor"];
        if (!allowedAccountTypes.includes(accountType)) {
            return ApiResponse.failure(res, "Invalid accountType");
        }

        const users = await User.find({ accountType }, { gender: 1, _id: 0 });

        let maleCount = 0;
        let femaleCount = 0;

        users.forEach((user) => {
            if (user.gender === "male") maleCount++;
            if (user.gender === "female") femaleCount++;
        });

        return ApiResponse.success(
            res,
            {
                Male: maleCount,
                Female: femaleCount,
            },
            "Data Fetched Successfully"
        );
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.getCounsellorDashboard = async (req, res) => {
    try {
        const now = new Date();

        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(now.getDate() - 60);

        const totalActiveCounsellors = await User.countDocuments({
            accountType: "counsellor",
            deactivationStatus: false,
            deleted: false,
        });

        const activeCounsellorsCurrentPeriod = await User.countDocuments({
            accountType: "counsellor",
            deactivationStatus: false,
            deleted: false,
            createdAt: { $gte: thirtyDaysAgo },
        });

        const activeCounsellorsPreviousPeriod = await User.countDocuments({
            accountType: "counsellor",
            deactivationStatus: false,
            deleted: false,
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        });

        const growthPercentage =
            activeCounsellorsPreviousPeriod === 0
                ? 100
                : Math.round(
                      ((activeCounsellorsCurrentPeriod -
                          activeCounsellorsPreviousPeriod) /
                          activeCounsellorsPreviousPeriod) *
                          100
                  );

        const newCounsellors = activeCounsellorsCurrentPeriod;
        const newCounsellorsPrevious = activeCounsellorsPreviousPeriod;

        const newCounsellorsChange =
            newCounsellorsPrevious === 0
                ? 100
                : Math.round(
                      ((newCounsellors - newCounsellorsPrevious) /
                          newCounsellorsPrevious) *
                          100
                  );

        const retentionRate =
            totalActiveCounsellors === 0
                ? 0
                : Math.round(
                      (activeCounsellorsCurrentPeriod /
                          totalActiveCounsellors) *
                          100
                  );

        const retentionRateChange =
            activeCounsellorsPreviousPeriod === 0
                ? 0
                : Math.round(
                      ((retentionRate -
                          (activeCounsellorsPreviousPeriod /
                              totalActiveCounsellors) *
                              100) /
                          ((activeCounsellorsPreviousPeriod /
                              totalActiveCounsellors) *
                              100)) *
                          100
                  );

        // Generate last 12 months dynamically
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthName = start.toLocaleString("default", {
                month: "short",
            });

            const current = await User.countDocuments({
                accountType: "counsellor",
                deactivationStatus: false,
                deleted: false,
                createdAt: { $gte: start, $lte: end },
            });

            const prevStart = new Date(
                start.getFullYear(),
                start.getMonth() - 1,
                1
            );
            const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);

            const previous = await User.countDocuments({
                accountType: "counsellor",
                deactivationStatus: false,
                deleted: false,
                createdAt: { $gte: prevStart, $lte: prevEnd },
            });

            monthlyData.push({
                month: monthName,
                current,
                previous,
            });
        }

        const dashboardData = {
            totalActiveCounsellors,
            activeCounsellorsCurrentPeriod,
            activeCounsellorsPreviousPeriod,
            growthPercentage,
            newCounsellors,
            newCounsellorsChange,
            retentionRate,
            retentionRateChange,
            monthlyData,
        };

        return ApiResponse.success(
            res,
            dashboardData,
            "Dashboard data fetched successfully"
        );
    } catch (error) {
        console.error(error);
        return ApiResponse.error(res, error.message);
    }
};

exports.getAgeRangeDistribution = async (req, res) => {
    try {
        const { gender } = req.query; // gender: 'male', 'female', or leave empty for all

        const now = new Date();

        // Age ranges definitions in years
        const ageRanges = [
            { label: "13-17", min: 13, max: 17 },
            { label: "18-24", min: 18, max: 24 },
            { label: "25-34", min: 25, max: 34 },
            { label: "35-44", min: 35, max: 44 },
            { label: "45-54", min: 45, max: 54 },
            { label: "55-64", min: 55, max: 64 },
            { label: "65+", min: 65, max: 150 }, // assuming max age 150
        ];

        // Build filter
        const filter = {
            accountType: "counsellor",
            deactivationStatus: false,
            deleted: false,
        };
        if (gender === "male" || gender === "female") {
            filter.gender = gender;
        }

        const users = await User.find(filter, { dateOfBirth: 1 });

        const totalUsers = users.length;

        const distribution = ageRanges.map((range) => {
            const count = users.filter((user) => {
                if (!user.dateOfBirth) return false;
                const age = Math.floor(
                    (now - new Date(user.dateOfBirth)) /
                        (365.25 * 24 * 60 * 60 * 1000)
                );
                return age >= range.min && age <= range.max;
            }).length;

            const percentage =
                totalUsers === 0 ? 0 : Math.round((count / totalUsers) * 100);
            return {
                range: range.label,
                percentage: `${percentage}%`,
                rawCount: count,
            };
        });

        return ApiResponse.success(
            res,
            distribution,
            "Age range distribution fetched successfully"
        );
    } catch (error) {
        console.error(error);
        return ApiResponse.error(res, error.message);
    }
};
