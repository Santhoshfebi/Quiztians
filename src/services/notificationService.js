import { supabase } from "../supabaseClient";

/**
 * Send a push notification from the authenticated
 * QUIZTIANS admin account.
 */
export async function sendPushNotification({
    title,
    body,
    screen = "home",
    type = "admin_broadcast",
    chapter = null,
}) {
    const cleanTitle = title?.trim();
    const cleanBody = body?.trim();

    if (!cleanBody) {
        throw new Error(
            "Notification message is required."
        );
    }

    if (
        cleanTitle &&
        cleanTitle.length > 120
    ) {
        throw new Error(
            "Notification title must be 120 characters or less."
        );
    }

    if (cleanBody.length > 500) {
        throw new Error(
            "Notification message must be 500 characters or less."
        );
    }

    const allowedScreens = [
        "home",
        "join",
        "leaderboard",
    ];

    const safeScreen =
        allowedScreens.includes(screen)
            ? screen
            : "home";

    console.log(
        "🔔 Sending QUIZTIANS notification..."
    );

    const { data, error } =
        await supabase.functions.invoke(
            "send-push-notification",
            {
                body: {
                    title:
                        cleanTitle ||
                        "QUIZTIANS",

                    body: cleanBody,

                    screen: safeScreen,

                    type,

                    chapter,
                },
            }
        );

    if (error) {
        console.error(
            "❌ Push notification function error:",
            error
        );

        throw new Error(
            error.message ||
            "Unable to send notification."
        );
    }

    if (!data?.success) {
        console.error(
            "❌ Push notification rejected:",
            data
        );

        throw new Error(
            data?.error ||
            "Unable to send notification."
        );
    }

    console.log(
        "✅ Notification sent:",
        data
    );

    return data;
}
