
/**
 * @typedef {Object} EmailData
 * @property {string} subject - The email subject
 * @property {string} recipientName - Name of the recipient
 * @property {string} body - The email body content
 * @property {Date} [date] - Optional date for the email
 */

/**
 * Generates an HTML email from the provided data
 * @param {EmailData} data - The email content and metadata
 * @returns {string} HTML string for the email
 */
export function generateEmail(data) {
    const emailDate = data.date || new Date();
    const formattedDate = emailDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>${data.subject}</h2>
                    <p>Dear ${data.recipientName},</p>
                    <div>${data.body}</div>
                    <p style="color: #666; margin-top: 20px;">${formattedDate}</p>
                </div>
            </body>
        </html>
    `.trim();
}
