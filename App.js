import React, { useState } from "react";
import { app, database } from "./firebase.js";
import { collection, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Button, StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useCollection } from "react-firebase-hooks/firestore";
import Detail from "./Detail";
import { FlatList } from "react-native-gesture-handler";

const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [editObj, setEditObj] = useState(null);
  const [values, loading, error] = useCollection(collection(database, "notes"));
  const data = values?.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

  // Tilføjelse af en ny note med billed-URL, hvis tilgængelig
  async function buttonHandler() {
    if (note.trim()) {
      try {
        const docRef = await addDoc(collection(database, "notes"), {
          note: note,
          image: "", // Vi sætter billed-URL som tomt som standard her
        });
        console.log("Document written with ID: ", docRef.id);

        setNotes([...notes, { id: docRef.id, note, image: "" }]); // Opdater listen over noter
        setNote("");
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    } else {
      alert("Note cannot be empty!");
    }
  }

  // Sletning af note
  async function deleteDocument(id) {
    await deleteDoc(doc(database, "notes", id));
    setNotes(notes.filter((note) => note.id !== id));
  }

  // Visning af dialog til opdatering af note
  function viewUpdateDialog(item) {
    setEditObj(item);
    setNote(item.note);
  }

  // Opdatering af note
  async function saveUpdate() {
    if (!editObj) return;

    try {
      await updateDoc(doc(database, "notes", editObj.id), {
        note: note,
        image: editObj.image || "", // Hvis der allerede er en billed-URL, bevar den
      });

      const updatedNotes = notes.map((n) => (n.id === editObj.id ? { ...n, note: note, image: editObj.image || "" } : n));
      setNotes(updatedNotes);

      setNote("");
      setEditObj(null);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  }

  // Funktion til at opdatere note og billede fra Detail
  function updateNote(index, updatedNote) {
    const updatedNotes = notes.map((noteObj, i) => (i === index ? { ...noteObj, ...updatedNote } : noteObj));
    setNotes(updatedNotes);
  }

  return (
    <View style={styles.container}>
      {editObj && (
        <View>
          <TextInput value={note} onChangeText={(note) => setNote(note)} />
          <Text style={styles.saveButton} onPress={saveUpdate}>
            Save
          </Text>
        </View>
      )}
      <Text>Notes!</Text>
      <TextInput style={styles.input} placeholder="Add a note" value={note} onChangeText={(text) => setNote(text)} />
      <Button title="Add Note" onPress={buttonHandler} />
      <ScrollView style={styles.notesContainer}>
        {notes.map((noteObj, index) => (
          <TouchableOpacity
            key={index}
            style={styles.noteButton}
            onPress={() => navigation.navigate("Detail", { note: noteObj.note, image: noteObj.image, index, updateNote })}
          >
            <Text style={styles.noteItem}>{noteObj.note.length > 25 ? `${noteObj.note.substring(0, 25)}...` : noteObj.note}</Text>
            {noteObj.image ? <Image source={{ uri: noteObj.image }} style={{ width: 100, height: 100 }} /> : null}{" "}
            {/* Hvis der er et billede, vis det */}
          </TouchableOpacity>
        ))}

        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View>
              <Text>{item.note}</Text>
              {item.image && <Image source={{ uri: item.image }} style={{ width: 100, height: 100 }} />}
              <Text style={styles.deleteButton} onPress={() => deleteDocument(item.id)}>
                Delete
              </Text>
              <Text style={styles.updateButton} onPress={() => viewUpdateDialog(item)}>
                Update
              </Text>
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Detail" component={Detail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

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
  notesContainer: {
    marginTop: 20,
    width: "80%",
  },
  noteButton: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  noteItem: {
    fontSize: 16,
  },
  deleteButton: {
    color: "red",
  },
  updateButton: {
    color: "blue",
  },
  saveButton: {
    color: "blue",
    marginBottom: 20,
  },
});
