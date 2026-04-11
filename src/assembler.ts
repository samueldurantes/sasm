import { Instruction } from "./parser";

type Microinstruction = {
  extdataout: number;
  r1in: number;
  r1out: number;
  r2in: number;
  r2out: number;
  r3in: number;
  r3out: number;
  accin: number;
  accout: number;
  auxin: number;
  andout: number;
  orout: number;
  xorout: number;
  addsub: number;
  addout: number;
  di3: number;
  di2: number;
  di1: number;
  di0: number;
};

type R = {
  instruction: string;
  opcode: number;
  microinstructions: Microinstruction;
};

export class Assembler {
  private instructions: Instruction[] = [];

  constructor(instructions: Instruction[]) {
    this.instructions = instructions;
  }

  mount(): R[] {
    return this.instructions.flatMap((instruction) => {
      const text = this.format_instruction(instruction);
      const microinstructions: Microinstruction = {
        extdataout: 0,
        r1in: 0,
        r1out: 0,
        r2in: 0,
        r2out: 0,
        r3in: 0,
        r3out: 0,
        accin: 0,
        accout: 0,
        auxin: 0,
        andout: 0,
        orout: 0,
        xorout: 0,
        addsub: 0,
        addout: 0,
        di3: 0,
        di2: 0,
        di1: 0,
        di0: 0,
      };

      if (instruction.mnemonic == "ldi") {
        const ds = this.number_to_bin(instruction.arg1);
        const mlid0 = {
          ...microinstructions,
          extdataout: 1,
          [instruction.arg0 + "in"]: 0,
          ...ds,
        };
        const mlid1 = {
          ...microinstructions,
          extdataout: 1,
          [instruction.arg0 + "in"]: 1,
          ...ds,
        };

        return [
          {
            instruction: text,
            microinstructions: mlid0,
            opcode: this.generate_opcode(mlid0),
          },
          {
            instruction: text,
            microinstructions: mlid1,
            opcode: this.generate_opcode(mlid1),
          },
        ];
      }

      if (instruction.mnemonic == "mov") {
        const mmov0 = {
          ...microinstructions,
          [instruction.arg1 + "out"]: 1,
        };
        const mmov1 = {
          ...microinstructions,
          [instruction.arg0 + "in"]: 1,
          [instruction.arg1 + "out"]: 1,
        };

        return [
          {
            instruction: text,
            microinstructions: mmov0,
            opcode: this.generate_opcode(mmov0),
          },
          {
            instruction: text,
            microinstructions: mmov1,
            opcode: this.generate_opcode(mmov1),
          },
        ];
      }

      if (
        instruction.mnemonic == "add" ||
        instruction.mnemonic == "or" ||
        instruction.mnemonic == "xor" ||
        instruction.mnemonic == "and"
      ) {
        const m0: Microinstruction = {
          ...microinstructions,
          [instruction.mnemonic + "out"]: 1,
        };
        const m1: Microinstruction = {
          ...microinstructions,
          [instruction.mnemonic + "out"]: 1,
          [instruction.arg0 + "in"]: 1,
        };

        return [
          {
            instruction: text,
            microinstructions: m0,
            opcode: this.generate_opcode(m0),
          },
          {
            instruction: text,
            microinstructions: m1,
            opcode: this.generate_opcode(m1),
          },
        ];
      }

      if (instruction.mnemonic == "sub") {
        const msub0: Microinstruction = {
          ...microinstructions,
          ["add" + instruction.mnemonic]: 1,
          addout: 1,
        };
        const msub1: Microinstruction = {
          ...microinstructions,
          ["add" + instruction.mnemonic]: 1,
          [instruction.arg0 + "in"]: 1,
        };

        return [
          {
            instruction: text,
            microinstructions: msub0,
            opcode: this.generate_opcode(msub0),
          },
          {
            instruction: text,
            microinstructions: msub1,
            opcode: this.generate_opcode(msub1),
          },
        ];
      }

      if (instruction.mnemonic == "nop") {
        return [
          {
            instruction: text,
            microinstructions,
            opcode: this.generate_opcode(microinstructions),
          },
          {
            instruction: text,
            microinstructions,
            opcode: this.generate_opcode(microinstructions),
          },
        ];
      }

      return [];
    });
  }

  private generate_opcode(microinstructions: Microinstruction) {
    const concat_bin = (bins: number[]) => bins.join("");

    const d18_16 = concat_bin([
      microinstructions.extdataout,
      microinstructions.r1in,
      microinstructions.r1out,
    ]);
    const d15_8 = concat_bin([
      microinstructions.r2in,
      microinstructions.r2out,
      microinstructions.r3in,
      microinstructions.r3out,
      microinstructions.accin,
      microinstructions.accout,
      microinstructions.auxin,
      microinstructions.andout,
    ]);
    const d7_0 = concat_bin([
      microinstructions.orout,
      microinstructions.xorout,
      microinstructions.addsub,
      microinstructions.addout,
      microinstructions.di3,
      microinstructions.di2,
      microinstructions.di1,
      microinstructions.di0,
    ]);

    return (
      parseInt(d18_16, 2) * 256 * 256 +
      parseInt(d15_8, 2) * 256 +
      parseInt(d7_0, 2)
    );
  }

  private format_instruction(instruction: Instruction): string {
    if (instruction.mnemonic != "nop") {
      return "NOP";
    }

    const mn = instruction.mnemonic.toUpperCase();
    const a0 =
      // @ts-ignore
      typeof instruction.arg0 == "string"
        ? // @ts-ignore
          instruction.arg0.toUpperCase()
        : // @ts-ignore
          String(instruction.arg0);
    const a1 =
      // @ts-ignore
      typeof instruction.arg1 == "string"
        ? // @ts-ignore
          instruction.arg1.toUpperCase()
        : // @ts-ignore
          String(instruction.arg1);
    return `${mn} ${a0},${a1}`;
  }

  private number_to_bin(n: string | number) {
    if (typeof n != "number") {
      return {};
    }

    return {
      di3: (n >> 3) & 1,
      di2: (n >> 2) & 1,
      di1: (n >> 1) & 1,
      di0: (n >> 0) & 1,
    };
  }
}
