const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.warn("⚠️ WARNING: Please provide a MONGO_URI in your .env file to connect to MongoDB!");
} else {
    mongoose.connect(mongoUri)
        .then(() => console.log('✅ Connected to MongoDB cloud database.'))
        .catch(err => console.error('❌ Failed to connect to MongoDB:', err));
}

// Schemas
const guildSettingsSchema = new mongoose.Schema({
    guild_id: { type: String, required: true, unique: true },
    welcome_channel_id: String,
    welcome_message: String,
    welcome_bg_url: String,
    leave_channel_id: String,
    leave_message: String,
    leave_bg_url: String,
    autorole_id: String,
    level_up_channel_id: String,
    bot_commands_channel_id: String,
    xp_logs_channel_id: String
});

const userLevelSchema = new mongoose.Schema({
    guild_id: { type: String, required: true },
    user_id: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 }
});
userLevelSchema.index({ guild_id: 1, user_id: 1 }, { unique: true });

const levelRoleSchema = new mongoose.Schema({
    guild_id: { type: String, required: true },
    level: { type: Number, required: true },
    role_id: { type: String, required: true }
});
levelRoleSchema.index({ guild_id: 1, level: 1 }, { unique: true });

// Models
const GuildSettings = mongoose.model('GuildSettings', guildSettingsSchema);
const UserLevel = mongoose.model('UserLevel', userLevelSchema);
const LevelRole = mongoose.model('LevelRole', levelRoleSchema);

// --- Guild Configs ---
const getGuildConfig = async (guildId) => {
    return await GuildSettings.findOne({ guild_id: guildId }).lean();
};

const setGuildConfig = async (payload) => {
    await GuildSettings.findOneAndUpdate(
        { guild_id: payload.guild_id },
        { $set: payload },
        { upsert: true, new: true }
    );
};

// --- Leveling System ---
const addXP = async (guildId, userId, amount) => {
    let row = await UserLevel.findOne({ guild_id: guildId, user_id: userId });
    
    let currentXp = row ? row.xp : 0;
    let oldLevel = row ? Math.floor(Math.sqrt(currentXp / 100)) : 0;
    
    let newXp = currentXp + amount;
    let newLevel = Math.floor(Math.sqrt(newXp / 100));

    if (!row) {
        await UserLevel.create({ guild_id: guildId, user_id: userId, xp: newXp, level: newLevel });
    } else {
        await UserLevel.updateOne({ _id: row._id }, { xp: newXp, level: newLevel });
    }
    return { oldLevel, newLevel, newXp, leveledUp: newLevel > oldLevel, xpRequired: 100 * Math.pow(newLevel + 1, 2) };
};

const getRank = async (guildId, userId) => {
    let row = await UserLevel.findOne({ guild_id: guildId, user_id: userId });
    if (!row) return { xp: 0, level: 0, rank: 0 };
    
    let rankCount = await UserLevel.countDocuments({ guild_id: guildId, xp: { $gt: row.xp } });
    return { xp: row.xp, level: row.level, rank: rankCount + 1 };
};

const getLeaderboard = async (guildId, limit = 10) => {
    return await UserLevel.find({ guild_id: guildId }).sort({ xp: -1 }).limit(limit).lean();
};

const getLevelRoles = async (guildId) => {
    return await LevelRole.find({ guild_id: guildId }).sort({ level: 1 }).lean();
};

const setLevelRole = async (guildId, level, roleId) => {
    await LevelRole.findOneAndUpdate(
        { guild_id: guildId, level: level },
        { role_id: roleId },
        { upsert: true }
    );
};

const deleteLevelRole = async (guildId, level) => {
    await LevelRole.deleteOne({ guild_id: guildId, level: level });
};

module.exports = {
  db: mongoose.connection,
  getGuildConfig, setGuildConfig,
  addXP, getRank, getLeaderboard,
  getLevelRoles, setLevelRole, deleteLevelRole,
  GuildSettings, UserLevel, LevelRole
};
