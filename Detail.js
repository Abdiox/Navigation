import React, { useEffect, useState } from "react";
import { View, TextInput, Button, Image, StyleSheet, Text, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const Detail = ({ route, navigation }) => {
  const { note, index, updateNote } = route.params;
  const [imageUrl, setImageUrl] = useState(note.image || "");
  const [localImageUri, setLocalImageUri] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log("Received note:", note); // Log for debugging
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);

  const uploadImage = async (imageUri) => {
    const storage = getStorage(app);
    const imageName = `images/${Date.now()}`;
    const ref = storageRef(storage, imageName);

    try {
      const imgResponse = await fetch(imageUri);
      const blob = await imgResponse.blob();
      const snapshot = await uploadBytes(ref, blob);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log("Upload successful, URL:", downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handleSave = async () => {
    setUploading(true);
    const imageUrlToSave = localImageUri ? await uploadImage(localImageUri) : imageUrl;
    console.log("Image URL to save:", imageUrlToSave);
    if (imageUrlToSave) {
      updateNote(index, { note: note.note, image: imageUrlToSave });
      navigation.goBack();
    } else {
      Alert.alert("Failed to upload image");
    }
    setUploading(false);
  };

  const handleGetImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {/* <TextInput style={styles.input} value={note && note.note ? `Dette her er noten: "${note.note}"` : "Indlæser note..."} editable={false} /> */}
      <Button title="Save" onPress={handleSave} />
      <Button title="Select Image" onPress={handleGetImage} />
      {localImageUri ? (
        <Image style={styles.image} source={{ uri: localImageUri }} />
      ) : imageUrl ? (
        <Image style={styles.image} source={{ uri: imageUrl }} />
      ) : null}
      {uploading && <Text>Uploading image...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    width: "80%",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
  },
});

export default Detail;
