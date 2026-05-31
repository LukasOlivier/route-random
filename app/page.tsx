import ClientPageWrapper from "./components/ClientPageWrapper";
import RouteStats from "./components/RouteStats";

export default async function Home() {
  return (
    <main>
      <ClientPageWrapper>
        <RouteStats />
      </ClientPageWrapper>
    </main>
  );
}
