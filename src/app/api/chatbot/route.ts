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

        if (!process.env.DIALOGFLOW_PROJECT_ID || !process.env.DIALOGFLOW_CLIENT_EMAIL || !process.env.DIALOGFLOW_PRIVATE_KEY) {
            throw new Error('Dialogflow configuration is missing');
        }

        // Dynamic import
        const dialogflowModule = await import('@google-cloud/dialogflow');
        const SessionsClient = dialogflowModule.SessionsClient;

        const dialogflowClient = new SessionsClient({
            credentials: {
                client_email: process.env.DIALOGFLOW_CLIENT_EMAIL,
                private_key: process.env.DIALOGFLOW_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
        });

        const sessionId = customSessionId || 'default-session';
        const sessionPath = dialogflowClient.projectAgentSessionPath(
            process.env.DIALOGFLOW_PROJECT_ID,
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
            "Xin chào! Tôi là trợ lý RiceLink. Tôi có thể giúp gì cho bạn về các sản phẩm gạo?",
            "Hiện tại tôi đang được nâng cấp. Bạn có thể hỏi tôi về các cửa hàng gạo hoặc sản phẩm!",
            "Tôi có thể giúp bạn tìm thông tin về cơ chế bảo đảm và giới thiệu sản phẩm.",
        ];

        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

        return NextResponse.json({
            reply: randomResponse,
            fallback: true,
            timestamp: new Date().toISOString()
        });
    }
}