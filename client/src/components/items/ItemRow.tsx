import { FiCheck, FiArrowUpRight } from "react-icons/fi";
import type { Item, Kind } from "../../types/workspace";
import { label, pretty, today } from "../../utils/workspace";
import { ItemDescription } from "./ItemDescription";

export function ItemRow({
  item,
  toggle,
  open,
}: {
  item: Item;
  toggle: (item: Item) => Promise<void>;
  open: (kind: Kind, item?: Item) => void;
}) {
  return (
    <div
      className="item-row flex items-center gap-3 p-[17px_22px] [border-top:1px_solid_#f2eff6] max-[1100px]:p-[16px_15px] max-[1100px]:gap-2 max-[1100px]:[&_.priority]:hidden"
      key={item.id}
    >
      <button
        className={
          "check w-[17px] h-[17px] [border:1px_solid_#d9d1e4] rounded-[5px] grid place-items-center shrink-0 p-0 [&.checked]:bg-[#a58bc8] [&.checked]:text-white [&.checked]:border-[#a58bc8] " +
          (item.status === "done" ? "checked" : "")
        }
        aria-label={item.status === "done" ? "Reopen item" : "Complete item"}
        onClick={() => void toggle(item)}
      >
        {item.status === "done" && <FiCheck />}
      </button>
      <button
        className="item-main flex-1 min-w-0 text-left p-0"
        onClick={() => open(item.kind, item)}
      >
        <strong
          className={
            "block text-[length:calc(0.7857rem*var(--main-font-scale))] font-medium [overflow-wrap:anywhere] " +
            (item.status === "done" ? "done line-through text-[#aca5b3]" : "")
          }
        >
          {item.title}
        </strong>
        <ItemDescription description={item.description} />
        <span className="mt-1.5 block text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#aaa0b4]">
          {item.person || label(item.kind)}
          {item.subtasks.length > 0 &&
            ` · ${item.subtasks.filter((s) => s.done).length}/${item.subtasks.length} subtasks`}
        </span>
      </button>
      <span
        className={
          "priority text-[length:calc(0.5714rem*var(--main-font-scale))] capitalize p-[4px_7px] rounded-[5px] bg-[#f4f1f9] text-[#a18bb7] [&.high]:bg-[#fcf0ea] [&.high]:text-[#ce9a7f] [&.low]:bg-[#edf6f0] [&.low]:text-[#8fac98] " +
          item.priority
        }
      >
        {item.priority}
      </span>
      {item.date && (
        <span
          className={
            "date text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#9f94ad] whitespace-nowrap [&.late]:text-[#c88383] max-[760px]:text-[length:calc(0.5714rem*var(--main-font-scale))] " +
            (item.date < today && item.status === "open" ? "late" : "")
          }
        >
          {pretty(item.date)}
        </span>
      )}
      <button
        className="icon-btn inline-flex items-center justify-center p-[7px] text-[#a79bb6] rounded-[5px] hover:bg-[#f4f0f9]"
        aria-label="Edit item"
        onClick={() => open(item.kind, item)}
      >
        <FiArrowUpRight />
      </button>
    </div>
  );
}
