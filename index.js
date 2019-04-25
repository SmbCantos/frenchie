const path = require('path');
const restify = require('restify');

const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');

const { MainDialog } = require('./dialogs/mainDialog');

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    channelService: process.env.ChannelService,
    openIdMetadata: process.env.BotOpenIdMetadata
});

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError]: ${ error }`);
    await context.sendActivity(`Oops. Something went wrong!`);
    await conversationState.delete(context);
};

let conversationState, userState;

const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);
userState = new UserState(memoryStorage);

const logger = console;

const bot = new MainDialog(conversationState, userState, logger);

let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nSee https://aka.ms/connect-to-bot for more information`);
});

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await bot.onTurn(context);
    });
});
