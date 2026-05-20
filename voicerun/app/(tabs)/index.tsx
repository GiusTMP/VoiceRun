import { Image, View } from "react-native";
import Timer from "../components/Timer";
import { globalStyles } from "../styles/global";

export default function ActivityScreen() {
  return (
    <View style={globalStyles.container}>
      <Image source={require('../../assets/images/logo-app.png')} style={globalStyles.logo} />
      <Timer initialSeconds={60} autoStart={false} onComplete={ () => console.log("tempo scaduto")} />
    </View>
  );
}
