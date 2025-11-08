import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { message, sessionId: customSessionId } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Dynamic import
        const dialogflowModule = await import('@google-cloud/dialogflow');
        const SessionsClient = dialogflowModule.SessionsClient;

        let credentials;
        let projectId;

        // Method 1: Use GOOGLE_APPLICATION_CREDENTIALS_JSON (recommended for Vercel)
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            try {
                const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
                credentials = {
                    client_email: serviceAccount.client_email,
                    private_key: serviceAccount.private_key,
                };
                projectId = serviceAccount.project_id;
                console.log('Using GOOGLE_APPLICATION_CREDENTIALS_JSON');
            } catch (e) {
                console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
                throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format');
            }
        }
        // Method 2: Use individual env vars (legacy)
        else if (process.env.DIALOGFLOW_PROJECT_ID && process.env.DIALOGFLOW_CLIENT_EMAIL && process.env.DIALOGFLOW_PRIVATE_KEY) {
            let privateKey = process.env.DIALOGFLOW_PRIVATE_KEY;

            // Handle base64 encoded key
            if (!privateKey.includes('BEGIN PRIVATE KEY')) {
                try {
                    privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
                } catch (e) {
                    console.error('Base64 decode failed');
                }
            }

            // Replace escaped newlines
            privateKey = privateKey.replace(/\\n/g, '\n');

            credentials = {
                client_email: process.env.DIALOGFLOW_CLIENT_EMAIL,
                private_key: privateKey,
            };
            projectId = process.env.DIALOGFLOW_PROJECT_ID;
            console.log('Using individual env vars');
        } else {
            console.error('Missing Dialogflow configuration. Need either GOOGLE_APPLICATION_CREDENTIALS_JSON or DIALOGFLOW_* vars');
            throw new Error('Dialogflow configuration is missing');
        }

        const dialogflowClient = new SessionsClient({ credentials });

        const sessionId = customSessionId || 'default-session';
        const sessionPath = dialogflowClient.projectAgentSessionPath(
            projectId,
            sessionId
        );

        const requestDialogflow = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: message,
                    languageCode: 'vi',
                },
            },
        };

        const [response] = await dialogflowClient.detectIntent(requestDialogflow);
        const result = response.queryResult;

        return NextResponse.json({
            reply: result?.fulfillmentText || 'Xin lỗi, tôi không hiểu câu hỏi đó. Vui lòng thử lại.',
            intent: result?.intent?.displayName,
            confidence: result?.intentDetectionConfidence,
        });

    } catch (error) {
        console.error('Dialogflow Error:', error);

        // Fallback responses cho testing
        const fallbackResponses = [
            "Xin chào! Tôi là trợ lý RiceLink. Tôi có thể giúp gì cho bạn về dịch vụ sấy lúa?",
            "Hiện tại tôi đang được nâng cấp. Bạn có thể hỏi tôi về các lò sấy hoặc đơn vị vận chuyển!",
            "Tôi có thể giúp bạn tìm thông tin về giá sấy lúa và các dịch vụ liên quan.",
        ];

        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

        return NextResponse.json({
            reply: randomResponse,
            fallback: true,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}