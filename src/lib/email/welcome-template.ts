type TemplateOptions = {
  unsubscribeUrl: string;
};

export function buildWelcomeEmailHtml({ unsubscribeUrl }: TemplateOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Your Damnation Is Served</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
    body { margin:0; padding:0; background:#000; color:#ddd; font-family:Arial,sans-serif; }
    .full-width { width:100%; background:#000; border-collapse:collapse; }
    .wrapper { max-width:600px; margin:20px auto; background:#1a1a1a; border-radius:10px; overflow:hidden; }
    .header-cell { background:#111; padding:30px; text-align:center; border-bottom:3px solid #ff1a1a; }
    .body-cell { padding:30px; line-height:1.5; font-size:16px; color:#dddddd; }
    .easter { padding:10px; text-align:center; }
    .easter img { width:50px; height:50px; opacity:0.8; display:block; margin:0 auto; border:0; }
    .easter-text { font-size:12px; color:#666; letter-spacing:1px; margin-top:4px; }
    .social-cell { padding:20px; text-align:center; }
    .social-cell img { width:24px; height:24px; display:inline-block; margin:0 8px; border:0; }
    .cta-cell { padding:20px; text-align:center; }
    .cta-btn {
      background:#ff1a1a;
      color:#fff;
      text-decoration:none;
      padding:15px 30px;
      border-radius:6px;
      font-weight:bold;
      letter-spacing:1px;
      display:inline-block;
    }
    .footer-separator td { padding:0; }
    .footer-separator .sep { height:4px; background:#ff1a1a; }
    .footer-cell {
      background:#111;
      padding:20px;
      text-align:center;
      font-size:12px;
      color:#666;
      line-height:1.4;
    }
    .footer-cell a { color:#888; text-decoration:none; }
  </style>
</head>
<body>
  <div style="display:none; max-height:0; overflow:hidden; font-size:1px; color:#000;">
    Your soul is now sold. Prepare for BloodThirst...
  </div>

  <div style="background-color: #000000; margin: 0; padding: 0;">
    <table class="full-width" style="background-color: #000000;">
      <tr>
        <td>
          <table class="wrapper">
            <tr>
              <td class="header-cell">
                <h1 style="
                  margin:0;
                  font-family:'Cinzel', serif;
                  font-size:48px;
                  line-height:1.1;
                  color:#ff1a1a;
                  letter-spacing:4px;
                  text-shadow:
                    -1px -1px 0 #000,
                     1px  1px 0 #000,
                     0 0 8px rgba(255,26,26,0.6),
                     0 0 16px rgba(255,26,26,0.4);
                  filter: drop-shadow(0 -1px 1px #550000);
                ">
                  DESCEND<br>INTO<br>THE ABYSS
                </h1>
              </td>
            </tr>

            <tr>
              <td class="body-cell">
                You’ve crossed the threshold into Unholy Co. Consider your soul officially sold—congrats, you beautiful sinner.
                <br><br>
                We’re not here to play nice or sip weak-ass tap water. We’re rewriting the rules of rebellion, one premium drop at a time. Expect chaos, luxury, and a thirst that’ll make your veins hum.
                <br><br>
                Something unholy is brewing—exclusive to the forsaken like you. Keep your eyes sharp; the first taste is ours to claim.
              </td>
            </tr>

            <tr>
              <td class="easter">
                <a href="https://theunholy.co/bloodthirst-teaser" style="text-decoration:none;">
                  <img src="https://theunholy.co/images/crimson.png" alt="Crimson Drop">
                </a>
                <div class="easter-text">
                  Dare to click the drop… unlock the sin.
                </div>
              </td>
            </tr>

            <tr>
              <td class="social-cell">
                <a href="https://instagram.com/theunholyco" style="text-decoration:none;"><img src="https://img.icons8.com/?size=100&id=32292&format=png&color=EA3323" alt="Instagram"></a>
                <a href="https://facebook.com/@theunholyco" style="text-decoration:none;"><img src="https://www.iconsdb.com/icons/preview/red/facebook-xxl.png" alt="Facebook"></a>
                <a href="https://x.com/theunholyco" style="text-decoration:none;"><img src="https://www.iconsdb.com/icons/preview/red/twitter-x-xxl.png" alt="X"></a>
              </td>
            </tr>

            <tr>
              <td class="cta-cell">
                <a href="https://theunholy.co/underworld" class="cta-btn">Unleash the Ritual</a>
              </td>
            </tr>

            <tr class="footer-separator">
              <td class="sep"></td>
            </tr>

            <tr>
              <td class="footer-cell">
                UNHOLY CO. | Hydration for the Damned<br>
                © 2025 All Rights Reserved<br>
                <a href="${unsubscribeUrl}" style="color:#888; text-decoration:none;">Escape the Abyss</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
