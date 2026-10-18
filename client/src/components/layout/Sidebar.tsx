import { FiLayers, FiSearch, FiBookOpen, FiUser } from "react-icons/fi";
import type { Workspace } from "../../hooks/useWorkspace";
import { FiGrid, FiCalendar, FiFlag, FiCheckSquare } from "react-icons/fi";
const nav = [
  ["Overview", FiGrid],
  ["Calendar", FiCalendar],
  ["Deadlines", FiFlag],
  ["Tasks", FiCheckSquare],
  ["Backlog", FiLayers],
  ["Skills", FiBookOpen],
] as const;

export function Sidebar({
  workspace,
}: {
  workspace: Pick<
    Workspace,
    | "page"
    | "setPage"
    | "navigationSearch"
    | "setNavigationSearch"
    | "setSearch"
    | "count"
  >;
}) {
  const {
    page,
    setPage,
    navigationSearch,
    setNavigationSearch,
    setSearch,
    count,
  } = workspace;
  return (
    <aside
      className="fixed inset-y-0 left-0 z-10 flex h-dvh w-[260px] flex-col overflow-y-auto border-r border-[#e9e9ec] bg-[#fafafa] px-2 max-[760px]:w-[220px] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-[#777b89] [&_button:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-[#777b89] [&_a:focus-visible]:outline-offset-2"
      aria-label="Workspace sidebar"
    >
      <a
        className="flex min-h-[60px] shrink-0 items-center gap-2.5 px-[9px] py-3 tracking-normal"
        href="#"
        onClick={() => setPage("Overview")}
      >
        <FiLayers className="size-[17px] text-[#292c34]" />
        <span className="text-[0.9286rem] font-medium leading-normal text-[#252831] [&_small]:block [&_small]:text-[0.7857rem] [&_small]:font-normal [&_small]:text-[#85858e]">
          Onespace<small>Personal workspace</small>
        </span>
      </a>
      <label className="mb-3 flex min-h-[34px] shrink-0 items-center gap-2 rounded-md border border-[#dedee3] bg-white px-2.5 text-[#8c8d96] shadow-[0_1px_2px_#16192205] focus-within:border-[#a5a7b0] focus-within:shadow-[0_0_0_2px_#2528310a] [&_svg]:size-[13px] [&_input]:w-full [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:py-2 [&_input]:text-[0.8571rem] [&_input]:text-[#353741] [&_input]:outline-none [&_input::placeholder]:text-[#85858e]">
        <FiSearch aria-hidden="true" />
        <input
          aria-label="Find a page"
          placeholder="Find a page…"
          value={navigationSearch}
          onChange={(event) => setNavigationSearch(event.target.value)}
        />
      </label>
      <nav className="grid gap-[3px]" aria-label="Main navigation">
        {nav
          .filter(([name]) =>
            name.toLowerCase().includes(navigationSearch.trim().toLowerCase()),
          )
          .map(([name, Icon]) => (
            <button
              key={name}
              className="flex min-h-[38px] w-full items-center justify-start gap-[9px] rounded-[5px] border border-transparent px-[9px] py-[7px] text-left text-[0.8571rem] font-normal leading-normal text-[#64656f] hover:bg-[#f0f0f2] hover:text-[#292c34] aria-[current=page]:border-[#e8e8ec] aria-[current=page]:bg-white aria-[current=page]:font-semibold aria-[current=page]:text-[#252831] aria-[current=page]:shadow-[0_1px_2px_#181b2505] [&_svg]:size-[14px] [&_svg]:stroke-[1.5]"
              aria-current={page === name ? "page" : undefined}
              onClick={() => {
                setPage(name);
                setSearch("");
              }}
            >
              <Icon />
              {name}
              {name === "Deadlines" && count("deadline") > 0 && (
                <span className="ml-auto inline-block rounded-[3px] bg-[#f1f1f3] px-[5px] text-[0.7143rem] font-medium leading-normal text-[#54555f]">
                  {count("deadline")}
                </span>
              )}
            </button>
          ))}
        {navigationSearch.trim() &&
          !nav.some(([name]) =>
            name.toLowerCase().includes(navigationSearch.trim().toLowerCase()),
          ) && (
            <p className="p-2.5 text-[0.8571rem] text-[#85858e]">
              No matching pages.
            </p>
          )}
      </nav>
      <div className="-mx-2 mt-auto block pt-6">
        <div className="flex items-center gap-[9px] border-t border-[#eaeaec] px-4 py-[15px] text-[0.8571rem] font-normal text-[#353741] [&_small]:mt-0.5 [&_small]:block [&_small]:text-[0.7143rem] [&_small]:text-[#8a8b93]">
          <span className="grid size-7 place-items-center rounded-full border border-[#dedee2] bg-[#eeeeef] text-[0.7857rem] text-[#65666f]">
            <FiUser aria-hidden="true" />
          </span>
          <div>
            My space<small>Personal account</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
