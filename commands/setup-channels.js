const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

// Noms des rôles de direction créés par /setup-roles — utilisés pour donner l'accès
// aux salons privés. Si un rôle n'existe pas encore, il est simplement ignoré.
const STAFF_ROLE_NAMES = [
  '👑 Fondateur du Sommeil',
  '🛡️ Co-Gardien Suprême',
  '💤 Maître de la Pension',
  '⚙️ Veilleur',
];

// Structure complète du serveur, du haut vers le bas.
const STRUCTURE = [
  {
    category: '📋 INFOS',
    channels: [
      { name: 'règlement', type: 'text' },
      { name: 'annonces', type: 'text' },
      { name: 'bienvenue', type: 'text' },
    ],
  },
  {
    category: '🏠 ACCUEIL',
    channels: [
      { name: 'général', type: 'text' },
      { name: 'présentations', type: 'text' },
      { name: 'memes-ronflex', type: 'text' },
    ],
  },
  {
    category: '🛡️ RECRUTEMENT',
    channels: [
      { name: 'candidatures', type: 'text' },
      { name: 'règles-recrutement', type: 'text' },
      { name: 'entretiens', type: 'text', private: true },
    ],
  },
  {
    category: '💤 PENSION POKÉMON',
    channels: [
      { name: 'annonces-pension', type: 'text' },
      { name: 'echanges', type: 'text' },
      { name: 'suivi-stock', type: 'text', private: true },
    ],
  },
  {
    category: '🛒 COMMERCE',
    channels: [
      { name: 'pokeshop', type: 'text' },
      { name: 'itemshop', type: 'text' },
      { name: 'serviceshop', type: 'text' },
    ],
  },
  {
    category: '📞 CONTACT & SUPPORT',
    channels: [
      { name: 'contact-staff', type: 'text', private: true },
      { name: 'tickets', type: 'text' },
    ],
  },
  {
    category: '🎙️ VOCAUX',
    channels: [
      { name: 'Clairière', type: 'voice' },
      { name: 'Territoire', type: 'voice' },
    ],
  },
  {
    category: '🔒 STAFF',
    categoryPrivate: true,
    channels: [
      { name: 'staff-chat', type: 'text' },
      { name: 'logs-bot', type: 'text' },
      { name: 'modération', type: 'text' },
    ],
  },
];

function buildPrivateOverwrites(guild, staffRoleIds) {
  return [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ...staffRoleIds.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel] })),
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-channels')
    .setDescription('Crée automatiquement toutes les catégories et salons RonflexCorp')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '⛔ Réservé aux administrateurs du serveur.', ephemeral: true });
    }
    await interaction.deferReply();

    const guild = interaction.guild;
    const botMember = await guild.members.fetchMe();

    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply(
        "❌ Je n'ai pas la permission \"Gérer les salons\". Donne-moi cette permission puis réessaie."
      );
    }

    const staffRoleIds = STAFF_ROLE_NAMES
      .map(name => guild.roles.cache.find(r => r.name === name))
      .filter(Boolean)
      .map(r => r.id);

    const missingStaffRoles = staffRoleIds.length < STAFF_ROLE_NAMES.length;

    const createdCategories = [];
    const createdChannels = [];
    const skipped = [];

    for (const block of STRUCTURE) {
      let category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === block.category
      );

      if (!category) {
        const categoryOptions = {
          name: block.category,
          type: ChannelType.GuildCategory,
          reason: `Créé via /setup-channels par ${interaction.user.tag}`,
        };
        if (block.categoryPrivate && staffRoleIds.length > 0) {
          categoryOptions.permissionOverwrites = buildPrivateOverwrites(guild, staffRoleIds);
        }
        category = await guild.channels.create(categoryOptions);
        createdCategories.push(block.category);
      } else {
        skipped.push(block.category);
      }

      for (const ch of block.channels) {
        const discordType = ch.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
        const existing = guild.channels.cache.find(
          c => c.name === ch.name.toLowerCase().replace(/\s+/g, '-') && c.parentId === category.id
        );
        if (existing) {
          skipped.push(`#${ch.name}`);
          continue;
        }

        const channelOptions = {
          name: ch.name,
          type: discordType,
          parent: category.id,
          reason: `Créé via /setup-channels par ${interaction.user.tag}`,
        };
        if (ch.private && !block.categoryPrivate && staffRoleIds.length > 0) {
          channelOptions.permissionOverwrites = buildPrivateOverwrites(guild, staffRoleIds);
        }
        await guild.channels.create(channelOptions);
        createdChannels.push(`#${ch.name}`);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🏗️ Configuration des salons RonflexCorp')
      .setColor(0x3F7FA6)
      .addFields(
        { name: `✅ Catégories créées (${createdCategories.length})`, value: createdCategories.join('\n') || 'Aucune (toutes existaient déjà)' },
        { name: `✅ Salons créés (${createdChannels.length})`, value: createdChannels.join('\n') || 'Aucun' },
        { name: `⏭️ Déjà existants (${skipped.length})`, value: skipped.join('\n') || 'Aucun' },
      );

    if (missingStaffRoles) {
      embed.setFooter({
        text: "⚠️ Certains rôles de direction n'existent pas encore (lance /setup-roles d'abord) — les salons privés ont été créés visibles par tous en attendant, pense à les corriger manuellement.",
      });
    }

    return interaction.editReply({ embeds: [embed] });
  },
};
