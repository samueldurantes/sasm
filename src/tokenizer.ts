export enum TokenKind {
  Ident = "Ident",
  Number = "Number",
  Ldi = "Ldi",
  Mov = "Mov",
  Add = "Add",
  Sub = "Sub",
  Or = "Or",
  Xor = "Xor",
  And = "And",
  Nop = "Nop",
  R1 = "R1",
  R2 = "R2",
  R3 = "R3",
  Acc = "Acc",
  Aux = "Aux",
  NewLine = "NewLine",
  Colon = "Colon",
  Comma = "Comma",
  Eof = "Eof",
}

export type Token = {
  kind: TokenKind;
  value?: string | number;
};

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 0;
  private col: number = 0;

  constructor(source: string) {
    this.source = source.toLowerCase();
  }

  private peek() {
    return this.source[this.pos] ? this.source[this.pos] : undefined;
  }

  private advance() {
    const current_char = this.peek();

    if (current_char == "\n") {
      this.line += 1;
      this.col = 0;
    } else {
      this.col += 1;
    }

    this.pos += 1;

    return current_char;
  }

  private skip_spaces() {
    while (this.peek() == " " || this.peek() == "\r" || this.peek() == "\t") {
      this.advance();
    }
  }

  private is_digit(ch?: string) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    return code >= 48 && code <= 57;
  }

  private is_letter(ch?: string) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    return code >= 97 && code <= 122;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    for (;;) {
      this.skip_spaces();

      let ch = this.peek();

      if (ch == undefined) {
        tokens.push({ kind: TokenKind.Eof });
        return tokens;
      }

      if (ch == "\n") {
        this.advance();
        const last = tokens[tokens.length - 1];
        if (tokens.length > 0 && last.kind !== TokenKind.NewLine) {
          tokens.push({ kind: TokenKind.NewLine });
        }
        continue;
      }

      if (this.is_digit(ch)) {
        let num_str = "";
        while (this.is_digit(this.peek())) {
          num_str += this.peek();
          this.advance();
        }
        tokens.push({ kind: TokenKind.Number, value: parseInt(num_str, 10) });
        continue;
      }

      const mnemonics: Record<string, Token> = {
        ldi: { kind: TokenKind.Ldi },
        mov: { kind: TokenKind.Mov },
        add: { kind: TokenKind.Add },
        sub: { kind: TokenKind.Sub },
        or: { kind: TokenKind.Or },
        xor: { kind: TokenKind.Xor },
        and: { kind: TokenKind.And },
        nop: { kind: TokenKind.Nop },
      };

      const registers: Record<string, Token> = {
        r1: { kind: TokenKind.R1 },
        r2: { kind: TokenKind.R2 },
        r3: { kind: TokenKind.R3 },
        acc: { kind: TokenKind.Acc },
        aux: { kind: TokenKind.Aux },
      };

      if (this.is_letter(ch)) {
        let str = ch;
        this.advance();
        while (this.is_letter(this.peek()) || this.is_digit(this.peek())) {
          str += this.peek();
          this.advance();
        }

        if (mnemonics[str]) {
          tokens.push(mnemonics[str]);
          continue;
        }

        if (registers[str]) {
          tokens.push(registers[str]);
          continue;
        }

        tokens.push({ kind: TokenKind.Ident, value: str });
        continue;
      }

      if (ch == ":") {
        this.advance();
        tokens.push({ kind: TokenKind.Colon });
        continue;
      }

      if (ch == ",") {
        this.advance();
        tokens.push({ kind: TokenKind.Comma });
        continue;
      }

      if (ch == ";") {
        while (this.peek() != "\n" && this.peek() != undefined) {
          this.advance();
        }
        continue;
      }

      throw new Error(`Symbol: '${ch}' not expected`);
    }
  }
}
