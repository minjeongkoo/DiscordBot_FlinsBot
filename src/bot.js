require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
  MessageFlags,
} = require("discord.js");
const { generate } = require("./ollama");
const { buildPrompt, saveHistory, resetHistory } = require("./freminet");
const { filter } = require("./filter");
const { load, save } = require("./storage");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ✅ 재시작해도 채널 설정 유지
const activeChannels = load();

const BLOCKED_RESPONSES = {
  spam:            "열정이 지나치시군요",
  too_long:        "이런 압박감은 오랜만입니다",
  blocked_keyword: "걱정해야 할 건 당신입니다",
  jailbreak:       "자. 눈을 감길.",
};

/* 슬래시 커맨드 등록 */
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("set-channel")
      .setDescription("이 채널을 플린스 봇 채팅 채널로 설정합니다.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .toJSON(),

    new SlashCommandBuilder()
      .setName("unset-channel")
      .setDescription("플린스 봇 채팅 채널 설정을 해제합니다.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .toJSON(),

    new SlashCommandBuilder()
      .setName("리셋")
      .setDescription("플린스와의 대화 기록을 초기화합니다.")
      .toJSON(),
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ 슬래시 커맨드 등록 완료");
  } catch (err) {
    console.error("[커맨드 등록 오류]", err);
  }
}

/* 봇 준비 */
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ ${c.user.tag} 로그인 성공`);
  console.log(`🤖 모델: ${process.env.OLLAMA_MODEL}`);
  await registerCommands();
});

/* 슬래시 커맨드 처리 */
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, channelId, guildId, user } = interaction;

  if (commandName === "set-channel") {
    activeChannels.set(guildId, channelId);
    save(activeChannels);
    console.log(`[set-channel] guildId=${guildId} → channelId=${channelId}`);

    await interaction.reply({
      content: "키릴·추도미로비치·플린스, 정식으로 인사드리겠습니다. 귀빈에 대한 예의로서 풀네임을 밝혔지만, 그렇게 부르지 않으셔도 됩니다. 편의상 플린스라고 불러주십시오",
    });
  }

  if (commandName === "unset-channel") {
    activeChannels.delete(guildId);
    save(activeChannels);
    console.log(`[unset-channel] guildId=${guildId} 해제됨`);

    await interaction.reply({
      content: "지시를 따르겠습니다",
    });
  }

  if (commandName === "리셋") {
    resetHistory(user.id);
    await interaction.reply({
      content: "[Done] 자. 눈을 감길.",
      flags: MessageFlags.Ephemeral,
    });
  }
});

/* 메시지 처리 — 핸들러는 딱 하나만! */
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const isDM = !message.guild;
  const isMentioned = message.mentions.has(client.user);
  const savedChannelId = message.guild
    ? activeChannels.get(message.guild.id)
    : null;
  const isActiveChannel = savedChannelId === message.channelId;

  if (!isDM && !isActiveChannel && !isMentioned) return;

  const userInput = message.content
    .replace(`<@${client.user.id}>`, "")
    .trim();

  if (!userInput) {
    await message.reply({
      content: "제가 걱정되십니까? 제 등불은 평범한 비로는 꺼지지 않으니 안심하세요",
      allowedMentions: { repliedUser: true },
    });
    return;
  }

  // 필터 적용
  const { blocked, reason } = filter(message.author.id, userInput);
  if (blocked) {
    console.log(`[필터 차단] user=${message.author.tag} reason=${reason}`);
    await message.reply({
      content: BLOCKED_RESPONSES[reason],
      allowedMentions: { repliedUser: true },
    });
    return;
  }

  await message.channel.sendTyping();

  const userId = message.author.id;
  const prompt = buildPrompt(userId, userInput);
  const reply = await generate(prompt);

  saveHistory(userId, userInput, reply);

  await message.reply({
    content: reply,
    allowedMentions: { repliedUser: true },
  });
});

client.login(process.env.DISCORD_TOKEN);