import { Token, TokenKind } from "./tokenizer";

type Mnemonic = "ldi" | "mov" | "add" | "sub" | "or" | "xor" | "and" | "nop";
type Register = "r1" | "r2" | "r3" | "acc" | "aux";

export type Instruction =
  | {
      mnemonic: string;
      arg0: string | number;
      arg1: string | number;
    }
  | {
      mnemonic: "nop";
    };

type Program = {
  label: string;
  instructions: Instruction[];
};

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse_program(): Program {
    const label = this.expect(this.peek().kind, [TokenKind.Ident]);
    this.expect(this.peek().kind, [TokenKind.Colon]);
    if (this.peek().kind == TokenKind.NewLine) {
      this.consume();
    }

    return {
      label: label.value as string,
      instructions: this.parse_instruction(),
    };
  }

  private parse_instruction(): Instruction[] {
    const mns = [
      TokenKind.Ldi,
      TokenKind.Mov,
      TokenKind.Add,
      TokenKind.Sub,
      TokenKind.Or,
      TokenKind.Xor,
      TokenKind.And,
    ];

    const rs = [
      TokenKind.R1,
      TokenKind.R2,
      TokenKind.R3,
      TokenKind.Acc,
      TokenKind.Aux,
    ];

    const instructions: Instruction[] = [];

    for (;;) {
      const tk = this.peek();

      if (
        tk.kind == TokenKind.Eof ||
        (tk.kind == TokenKind.NewLine &&
          this.tokens[this.pos + 1].kind == TokenKind.Eof)
      ) {
        return instructions;
      }

      if (tk.kind == TokenKind.Nop) {
        this.consume();
        instructions.push({ mnemonic: "nop" });
      }

      if (mns.includes(tk.kind)) {
        const mn = this.consume();
        const arg0 = this.expect(this.peek().kind, rs);
        this.expect(this.peek().kind, [TokenKind.Comma]);
        const arg1 = this.expect(this.peek().kind, [TokenKind.Number, ...rs]);
        this.expect(this.peek().kind, [TokenKind.NewLine]);
        instructions.push({
          mnemonic: this.mnemonic_from_token(mn),
          arg0: this.arg_from_token(arg0),
          arg1: this.arg_from_token(arg1),
        });
      }
    }
  }

  private mnemonic_from_token(token: Token): Mnemonic {
    switch (token.kind) {
      case TokenKind.Ldi:
        return "ldi";
      case TokenKind.Mov:
        return "mov";
      case TokenKind.Add:
        return "add";
      case TokenKind.Sub:
        return "sub";
      case TokenKind.Or:
        return "or";
      case TokenKind.Xor:
        return "xor";
      case TokenKind.And:
        return "and";
      case TokenKind.Nop:
        return "nop";
      default:
        throw new Error("Expected a valid mnemonic");
    }
  }

  private arg_from_token(token: Token): Register | number {
    switch (token.kind) {
      case TokenKind.R1:
        return "r1";
      case TokenKind.R2:
        return "r2";
      case TokenKind.R3:
        return "r3";
      case TokenKind.Aux:
        return "aux";
      case TokenKind.Acc:
        return "acc";
      case TokenKind.Number: {
        if (token.value == undefined || typeof token.value != "number") {
          throw new Error("Expected a valid numeric argument");
        }
        return token.value;
      }
      default:
        throw new Error("Expected a valid argument");
    }
  }

  private peek() {
    return this.tokens[this.pos];
  }

  private consume() {
    const token = this.peek();

    if (token.kind != TokenKind.Eof) {
      this.pos += 1;
    }

    return token;
  }

  private expect(kind: TokenKind, expected_kind: TokenKind[]) {
    if (expected_kind.includes(kind)) {
      return this.consume();
    }

    throw new Error(`Expected: ${expected_kind}, Found: ${kind}`);
  }
}
