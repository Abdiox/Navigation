import React, { useEffect, useState } from "react";
import { View, TextInput, Button, Image, StyleSheet, Text, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const Detail = ({ route, navigation }) => {
  const { note, index, updateNoteInFirestore } = route.params; // Modificeret parameter
  const [updatedNote, setUpdatedNote] = useState(note.note);
  const [imageUrl, setImageUrl] = useState(note.image || "");
  const [localImageUri, setLocalImageUri] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
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
    const imageName = `images/${Date.now()}`; // Unikt navn til billedet
    const ref = storageRef(storage, imageName);

    try {
      const imgResponse = await fetch(imageUri);
      const blob = await imgResponse.blob(); // Konverter billede til blob
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
    let imageUrlToSave = imageUrl;

    // Hvis der er valgt et nyt billede, upload det
    if (localImageUri) {
      imageUrlToSave = await uploadImage(localImageUri);
      if (!imageUrlToSave) {
        Alert.alert("Failed to upload image");
        setUploading(false);
        return;
      }
    }

    // Opdater noten med det nye billede (eller uden, hvis der ikke er ændret noget)
    const updatedData = { note: updatedNote, image: imageUrlToSave };
    updateNoteInFirestore(index, updatedData);
    setUploading(false);
    navigation.goBack();
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
      <TextInput style={styles.input} value={updatedNote} onChangeText={(text) => setUpdatedNote(text)} placeholder="Edit your note" />
      <Button title="Select Image" onPress={handleGetImage} />
      {localImageUri ? (
        <Image style={styles.image} source={{ uri: localImageUri }} />
      ) : imageUrl ? (
        <Image style={styles.image} source={{ uri: imageUrl }} />
      ) : null}
      {uploading ? <Text>Uploading image...</Text> : <Button title="Save" onPress={handleSave} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    width: "100%",
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
