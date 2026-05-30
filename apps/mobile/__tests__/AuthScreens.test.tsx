import { render, screen, userEvent } from "@testing-library/react-native";
import { LoginScreen } from "../src/screens/LoginScreen";
import { SignupScreen } from "../src/screens/SignupScreen";

describe("auth screens", () => {
  it("shows inline validation on empty login submit", async () => {
    const user = userEvent.setup();
    const onLogin = jest.fn();

    render(
      <LoginScreen onLogin={onLogin} onSwitchToSignUp={jest.fn()} />,
    );

    await user.press(screen.getByRole("button", { name: "entrar" }));

    expect(screen.getByText("Preencha seu usuario e sua senha.")).toBeOnTheScreen();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("shows backend login error feedback", () => {
    render(
      <LoginScreen
        onLogin={jest.fn()}
        onSwitchToSignUp={jest.fn()}
        error="Credenciais invalidas"
      />,
    );

    expect(screen.getByText("Credenciais invalidas")).toBeOnTheScreen();
  });

  it("blocks signup with a short password before the api call", async () => {
    const user = userEvent.setup();
    const onSignup = jest.fn();

    render(
      <SignupScreen onSignup={onSignup} onSwitchToLogin={jest.fn()} />,
    );

    await user.type(screen.getByLabelText("novo usuario"), "teste");
    await user.type(screen.getByLabelText("nova senha"), "123456");
    await user.press(screen.getByRole("button", { name: "criar conta" }));

    expect(
      screen.getByText("A senha precisa ter pelo menos 8 caracteres."),
    ).toBeOnTheScreen();
    expect(onSignup).not.toHaveBeenCalled();
  });

  it("shows the new username validation copy on signup", async () => {
    const user = userEvent.setup();
    const onSignup = jest.fn();

    render(
      <SignupScreen onSignup={onSignup} onSwitchToLogin={jest.fn()} />,
    );

    await user.type(screen.getByLabelText("nova senha"), "12345678");
    await user.press(screen.getByRole("button", { name: "criar conta" }));

    expect(screen.getByText("Escolha um nome de usuario.")).toBeOnTheScreen();
    expect(onSignup).not.toHaveBeenCalled();
  });
});
