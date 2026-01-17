import "react-native";
import React from "react";
import renderer from "react-test-renderer";

import { MessageContainer } from "../Ajora";

it("should render <MessageContainer /> and compare with snapshot", () => {
  const tree = renderer.create(<MessageContainer />).toJSON();

  expect(tree).toMatchSnapshot();
});
