import Foundation
import AVFoundation
import ExpoModulesCore
import UIKit

public class AlarmAudioModule: Module {
  private var audioPlayer: AVAudioPlayer?
  private var audioSession: AVAudioSession?
  private var isPlaying = false

  public func definition() -> ModuleDefinition {
    Name("AlarmAudio")

    Function("startAlarmRingtone") { (ringtoneUrl: String) -> Bool in
      return self.startAlarmRingtone(urlString: ringtoneUrl)
    }

    Function("stopAlarmRingtone") { () -> Bool in
      return self.stopAlarmRingtone()
    }

    Function("isAlarmPlaying") { () -> Bool in
      return self.isPlaying
    }
  }

  private func startAlarmRingtone(urlString: String) -> Bool {
    do {
      audioSession = AVAudioSession.sharedInstance()

      try audioSession?.setCategory(.playback, mode: .default, options: [.mixWithOthers])
      try audioSession?.setActive(true)

      guard let url = URL(string: urlString) else {
        print("[AlarmAudio] Invalid URL: \(urlString)")
        return false
      }

      let data = try Data(contentsOf: url)

      audioPlayer = try AVAudioPlayer(data: data)
      audioPlayer?.numberOfLoops = -1
      audioPlayer?.volume = 1.0
      audioPlayer?.prepareToPlay()

      let success = audioPlayer?.play() ?? false

      if success {
        isPlaying = true
        print("[AlarmAudio] Alarm ringtone started successfully")

        try audioSession?.setCategory(.playback, mode: .default, options: [])
        try audioSession?.setActive(true, options: [])
      }

      return success
    } catch {
      print("[AlarmAudio] Error starting alarm: \(error.localizedDescription)")
      return false
    }
  }

  private func stopAlarmRingtone() -> Bool {
    guard let player = audioPlayer else {
      return false
    }

    player.stop()
    isPlaying = false

    do {
      try audioSession?.setActive(false, options: .notifyOthersOnDeactivation)
    } catch {
      print("[AlarmAudio] Error deactivating audio session: \(error.localizedDescription)")
    }

    audioPlayer = nil
    print("[AlarmAudio] Alarm ringtone stopped")
    return true
  }
}
