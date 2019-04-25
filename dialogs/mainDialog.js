const { ActivityTypes, CardFactory } = require('botbuilder');
const { DialogSet, WaterfallDialog } = require('botbuilder-dialogs');
const Translator = require('./translator/translate');
const WelcomeCard = require('./resources/welcome.json');
const SelectionCard = require('./resources/selection');
const RequiredCard = require('./resources/required');
const language = require('./translator/lang.json');

const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_NAME_PROP = 'user_name';
const TRANSLATE_TO = 'translate_to';
const TEXT = 'text';
const TRANSLATE_TEXT = 'translate_text';
const RESEND_FORM = 'resend_form';
const REQUIRED_FORM = 'required_form';

class MainDialog {
    constructor(conversationState, userState) {
        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userName = this.userState.createProperty(USER_NAME_PROP);
        this.translateTo = this.userState.createProperty(TRANSLATE_TO);
        this.text = this.userState.createProperty(TEXT);
        this.dialogs = new DialogSet(this.dialogState);

        this.dialogs.add(new WaterfallDialog(RESEND_FORM, [
            this.resendForm.bind(this)
        ]));

        this.dialogs.add(new WaterfallDialog(TRANSLATE_TEXT, [
            this.translateText.bind(this)
        ]));

        this.dialogs.add(new WaterfallDialog(REQUIRED_FORM, [
            this.requiredForm.bind(this)
        ]));
    }

    async resendForm(step) {
        const selectioncard = CardFactory.adaptiveCard(SelectionCard);
        await step.context.sendActivity({ attachments: [selectioncard] });
        await step.endDialog();
    }

    async requiredForm(step) {
        const requiredcard = CardFactory.adaptiveCard(RequiredCard);
        await step.context.sendActivity({ attachments: [requiredcard] });
        await step.endDialog();
    }

    async translateText(step) {
        const translateTo = await this.translateTo.get(step.context, null);
        const text = await this.text.get(step.context, null);
        const code = language[translateTo].key;
        const translate = await Translator.Translate(code, text);
        const json = {
            '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
            'type': 'AdaptiveCard',
            'version': '1.0',
            'backgroundImage': 'https://cdn.shopify.com/s/files/1/0743/3339/products/RAL1001_BEIGE.jpg?v=1446712589',
            'body': [
                {
                    'type': 'TextBlock',
                    'spacing': 'medium',
                    'size': 'default',
                    'weight': 'bolder',
                    'text': 'Translation',
                    'wrap': true,
                    'maxLines': 0
                },
                {
                    'type': 'TextBlock',
                    'size': 'default',
                    'isSubtle': 'yes',
                    'text': `${ translateTo }: ${ translate[0].translations[0].text }`,
                    'wrap': true,
                    'maxLines': 0
                }
            ]
        };
        const responsecard = CardFactory.adaptiveCard(json);
        await step.context.sendActivity({ attachments: [responsecard] });
        await step.endDialog();
    }

    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            const dc = await this.dialogs.createContext(turnContext);
            if (!turnContext._activity.value) {
                await dc.beginDialog(RESEND_FORM);
            } else if (!turnContext._activity.value.text) {
                await dc.beginDialog(REQUIRED_FORM);
            } else {
                await this.translateTo.set(dc.context, turnContext._activity.value.translate_to);
                await this.text.set(dc.context, turnContext._activity.value.text);
                await dc.beginDialog(TRANSLATE_TEXT);
            }
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            if (turnContext.activity.membersAdded.length !== 0) {
                for (let idx in turnContext.activity.membersAdded) {
                    if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                        const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
                        await turnContext.sendActivity({ attachments: [welcomeCard] });
                        const selectioncard = CardFactory.adaptiveCard(SelectionCard);
                        await turnContext.sendActivity({ attachments: [selectioncard] });
                    }
                }
            }
        }

        await this.userState.saveChanges(turnContext);
        await this.conversationState.saveChanges(turnContext);
    }
}

module.exports.MainDialog = MainDialog;
