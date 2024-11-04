import { Platform } from "react-native";
import { PERMISSIONS, requestMultiple } from "react-native-permissions";

export const requestAndUpdatePermissions = async () => {
  if (Platform.OS === "ios") {
    // Request camera and mic permissions on iOS
    const results = await requestMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE]);
  } else if (Platform.OS === "android") {
    // Request camera, mic, bluetooth and notification permissions on Android
    const results = await requestMultiple([
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    ]);
  }
};
