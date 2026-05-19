import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BottomTabBar } from "@react-navigation/bottom-tabs";

export function createFilteredTabBar(hiddenRoutes: Set<string>) {
  return function FilteredTabBar(props: BottomTabBarProps) {
    const visibleKeys = new Set(
      props.state.routes
        .filter((route) => !hiddenRoutes.has(route.name))
        .map((route) => route.key),
    );

    const visibleRoutes = props.state.routes.filter((route) =>
      visibleKeys.has(route.key),
    );

    const visibleDescriptors = Object.fromEntries(
      Object.entries(props.descriptors).filter(([key]) => visibleKeys.has(key)),
    );

    const currentRoute = props.state.routes[props.state.index];
    let newIndex = visibleRoutes.findIndex(
      (route) => route.key === currentRoute.key,
    );
    if (newIndex === -1) newIndex = 0;

    const visibleState = {
      ...props.state,
      routes: visibleRoutes,
      index: newIndex,
    };

    return (
      <BottomTabBar
        {...props}
        state={visibleState}
        descriptors={visibleDescriptors}
      />
    );
  };
}
