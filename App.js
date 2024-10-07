import React, { useState } from "react";
import { View, TextInput, FlatList, StyleSheet } from "react-native";
import { Button, Card, FAB, Text } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { database } from "./firebase";
import Detail from "./Detail";

const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  const [note, setNote] = useState("");
  const [editObj, setEditObj] = useState(null);
  const [values, loading, error] = useCollection(collection(database, "notes"));
  const data = values?.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

  async function buttonHandler() {
    if (note.trim()) {
      try {
        await addDoc(collection(database, "notes"), {
          note: note,
          image: "", // Billed-URL som tomt som standard
        });
        setNote("");
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    } else {
      alert("Note cannot be empty!");
    }
  }

  async function deleteDocument(id) {
    try {
      await deleteDoc(doc(database, "notes", id));
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  }

  async function updateNoteInFirestore(id, updatedData) {
    try {
      await updateDoc(doc(database, "notes", id), updatedData);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Notes</Text>
      <TextInput style={styles.input} placeholder="Add a note" value={note} onChangeText={(text) => setNote(text)} />
      {editObj ? (
        <Button mode="contained" onPress={() => updateNoteInFirestore(editObj.id, { note })} style={styles.saveButton}>
          Save Changes
        </Button>
      ) : (
        <Button mode="contained" onPress={buttonHandler} style={styles.addButton}>
          Add Note
        </Button>
      )}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate("Detail", {
                note: item,
                index: item.id,
                updateNoteInFirestore,
              })
            }
          >
            <Card.Content>
              <Text style={styles.noteText}>{item.note}</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => deleteDocument(item.id)} color="red">
                Delete
              </Button>
              <Button onPress={() => setEditObj(item)} color="blue">
                Update
              </Button>
            </Card.Actions>
          </Card>
        )}
      />
      <FAB style={styles.fab} small icon="plus" onPress={buttonHandler} />
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
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  card: {
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  noteText: {
    fontSize: 16,
  },
  addButton: {
    marginBottom: 20,
  },
  saveButton: {
    marginBottom: 20,
    backgroundColor: "blue",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6200ee",
  },
});
