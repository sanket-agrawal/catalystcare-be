import { describe, expect, it } from "vitest";

describe("String & Validation Utilities", () => {
  describe("Email Validation", () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it("should validate correct email format", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("john.doe@company.co.uk")).toBe(true);
      expect(isValidEmail("test+tag@domain.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("invalid.email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user name@example.com")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("Phone Number Validation", () => {
    const isValidPhoneNumber = (phone: string): boolean => {
      const phoneRegex = /^[0-9]{10}$/;
      return phoneRegex.test(phone.replace(/\D/g, ""));
    };

    it("should validate valid 10-digit phone numbers", () => {
      expect(isValidPhoneNumber("1234567890")).toBe(true);
      expect(isValidPhoneNumber("9876543210")).toBe(true);
    });

    it("should validate phone with formatting", () => {
      expect(isValidPhoneNumber("123-456-7890")).toBe(true);
      expect(isValidPhoneNumber("9876543210")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(isValidPhoneNumber("123456789")).toBe(false); // Too short
      expect(isValidPhoneNumber("12345678901")).toBe(false); // Too long
      expect(isValidPhoneNumber("abcdefghij")).toBe(false); // Non-numeric
    });
  });

  describe("String Slugification", () => {
    const slugify = (str: string): string => {
      return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
    };

    it("should convert to lowercase with hyphens", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("Mental Health Therapy")).toBe("mental-health-therapy");
    });

    it("should remove special characters", () => {
      expect(slugify("Test@123!")).toBe("test123");
      expect(slugify("Therapy & Wellness")).toBe("therapy--wellness");
    });

    it("should handle multiple spaces", () => {
      expect(slugify("Multiple   Spaces")).toBe("multiple-spaces");
    });

    it("should handle empty string", () => {
      expect(slugify("")).toBe("");
    });

    it("should handle whitespace only", () => {
      expect(slugify("   ")).toBe("");
    });
  });

  describe("String Truncation", () => {
    const truncate = (str: string, length: number, suffix: string = "..."): string => {
      if (str.length <= length) return str;
      return str.slice(0, length - suffix.length) + suffix;
    };

    it("should truncate long strings", () => {
      expect(truncate("Hello World", 8)).toBe("Hello...");
    });

    it("should not truncate short strings", () => {
      expect(truncate("Hi", 10)).toBe("Hi");
    });

    it("should use custom suffix", () => {
      expect(truncate("Hello World", 9, "-end")).toBe("Hello-end");
    });

    it("should handle exact length", () => {
      expect(truncate("Hello", 5)).toBe("Hello");
    });
  });

  describe("String Capitalization", () => {
    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const titleCase = (str: string): string => {
      return str
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    };

    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("WORLD")).toBe("World");
    });

    it("should handle single character", () => {
      expect(capitalize("a")).toBe("A");
    });

    it("should convert to title case", () => {
      expect(titleCase("hello world")).toBe("Hello World");
      expect(titleCase("MENTAL HEALTH THERAPY")).toBe("Mental Health Therapy");
    });
  });

  describe("Whitespace Utilities", () => {
    const removeExtraWhitespace = (str: string): string => {
      return str.replace(/\s+/g, " ").trim();
    };

    const removeAllWhitespace = (str: string): string => {
      return str.replace(/\s/g, "");
    };

    it("should remove extra spaces", () => {
      expect(removeExtraWhitespace("Hello   World")).toBe("Hello World");
      expect(removeExtraWhitespace("  Multiple  Spaces  ")).toBe("Multiple Spaces");
    });

    it("should remove all whitespace", () => {
      expect(removeAllWhitespace("Hello World")).toBe("HelloWorld");
      expect(removeAllWhitespace("  Test  ")).toBe("Test");
    });
  });

  describe("Type Coercion", () => {
    const toBoolean = (value: any): boolean => {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") return value.toLowerCase() === "true";
      return Boolean(value);
    };

    const toNumber = (value: any, fallback: number = 0): number => {
      const num = Number(value);
      return isNaN(num) ? fallback : num;
    };

    it("should coerce to boolean", () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean("true")).toBe(true);
      expect(toBoolean("false")).toBe(false);
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean(0)).toBe(false);
    });

    it("should coerce to number with fallback", () => {
      expect(toNumber("123")).toBe(123);
      expect(toNumber("invalid")).toBe(0);
      expect(toNumber("invalid", -1)).toBe(-1);
      expect(toNumber(undefined, 99)).toBe(99);
    });
  });

  describe("Array Utilities", () => {
    const unique = <T>(arr: T[]): T[] => {
      return [...new Set(arr)];
    };

    const chunk = <T>(arr: T[], size: number): T[][] => {
      const result: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };

    it("should get unique items", () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(["a", "b", "a"])).toEqual(["a", "b"]);
    });

    it("should chunk array", () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk(["a", "b", "c"], 1)).toEqual([["a"], ["b"], ["c"]]);
    });
  });

  describe("Object Utilities", () => {
    const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
      const result = {} as Pick<T, K>;
      keys.forEach((key) => {
        result[key] = obj[key];
      });
      return result;
    };

    const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
      const result = { ...obj };
      keys.forEach((key) => {
        delete result[key];
      });
      return result;
    };

    it("should pick object properties", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
    });

    it("should omit object properties", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
    });
  });
});
