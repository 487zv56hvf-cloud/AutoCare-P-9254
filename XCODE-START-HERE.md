# AutoCare: open and test in Xcode

## Easy way: use Runable Xcode Tester
1. Double-click **Runable Xcode Tester.command** (keep it anywhere on your Mac, e.g. Desktop).
   - First time: if macOS blocks it, right-click it > **Open** > **Open**.
   - Still blocked? Go to System Settings > Privacy & Security, scroll down, click **Open Anyway**.
2. Drag this zip into the window and press Enter. If the zip is the newest one in Downloads, just press Enter.
3. It asks before installing anything that's missing. Then it sets up the project and opens Xcode.
4. In Xcode, go to **Signing & Capabilities** and pick your **Team** (your Apple ID). Then press ▶.

## Manual way
You need Xcode, Node, Bun and CocoaPods:

```sh
brew install node cocoapods
curl -fsSL https://bun.sh/install | bash
```

Then, inside this folder:

```sh
bun install
cd packages/mobile/ios
pod install
open *.xcworkspace
```

Always open the **.xcworkspace** file, not the .xcodeproj.

## Signing and running
1. Add your Apple ID in Xcode > Settings > Accounts.
2. Click the blue app icon in the left list > **Signing & Capabilities** > pick your **Team**.
3. If Xcode says the bundle identifier is taken, change it to your own, e.g. `com.yourname.AutoCare`.
4. Choose an iPhone Simulator or your plugged-in iPhone at the top of Xcode, then press ▶.
5. First time on a real iPhone:
   - Settings > Privacy & Security > **Developer Mode** > On.
   - Settings > General > VPN & Device Management > trust your Apple ID.

The project is set to **Release**, so the app runs on its own without your Mac. With a free Apple ID, the app keeps opening on your iPhone for 7 days. After that, press ▶ again.

## Notes
- The app talks to the server at: https://carcare-n52xe4z-preview-4200.runable.site/
  - If that is a `preview` link, it only works while the Runable preview is running.
  - After you publish, put the published address in `packages/mobile/app.json` > `extra.apiUrl` and press ▶ again.
- Secret keys are **not** in this zip. They stay on the server, and the phone app doesn't need them.
