"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Card, Section } from "../types";
import backArrowDark from "../../media/back arrow D accent.svg";
import backArrowLight from "../../media/back arrow L accent.svg";
import darkWordmark from "../../media/Dark_SHAIKH MOHAMMED AHMED.svg";
import wordmark from "../../media/SHAIKH MOHAMMED AHMED.svg";
import filterIcon from "../../media/filter.svg";
import moonIcon from "../../media/moon.svg";
import searchIcon from "../../media/search.svg";
import sunIcon from "../../media/sun.svg";

type SystemShellProps = {
  sections: Section[];
  cards: Card[];
  children?: React.ReactNode;
};

type ExpansionAnchor = "left" | "right";

export default function SystemShell({
  sections,
  cards,
  children,
}: SystemShellProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileActiveCardId, setMobileActiveCardId] = useState<string | null>(null);
  const [pendingSectionSlug, setPendingSectionSlug] = useState<string | null>(null);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [expansionAnchor, setExpansionAnchor] = useState<ExpansionAnchor>("left");
  const [navigationTargetCardId, setNavigationTargetCardId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [pressedControl, setPressedControl] = useState<"search" | "filter" | null>(null);
  const [commandValue, setCommandValue] = useState("");
  const [caretIndex, setCaretIndex] = useState(0);
  const [caretOffset, setCaretOffset] = useState(0);
  const [inputScrollLeft, setInputScrollLeft] = useState(0);
  const [isCommandFocused, setIsCommandFocused] = useState(false);
  const [isRailScrolling, setIsRailScrolling] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const firstCardIndexRef = useRef<HTMLDivElement | null>(null);
  const cardScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const commandMeasureRef = useRef<HTMLSpanElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const searchResultRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollIdleTimeoutRef = useRef<number | null>(null);
  const hoverActivationTimeoutRef = useRef<number | null>(null);
  const trackpadGestureAxisRef = useRef<"x" | "y" | null>(null);
  const trackpadGestureTotalsRef = useRef({ x: 0, y: 0 });
  const trackpadGestureTimeoutRef = useRef<number | null>(null);
  const mobileTouchStartRef = useRef<{ cardId: string; x: number; y: number } | null>(null);
  const mobileTouchDraggingRef = useRef(false);
  const routeSlug = pathname.slice(1) || null;
  const effectivePendingSlug =
    pendingSectionSlug && pendingSectionSlug !== routeSlug ? pendingSectionSlug : null;
  const activeSlug = effectivePendingSlug ?? routeSlug;
  const activeSection = useMemo(
    () => sections.find((section) => section.slug === activeSlug) ?? null,
    [activeSlug, sections]
  );
  const sectionById = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections]
  );
  const activeCards = useMemo(() => {
    if (!activeSection) {
      return [];
    }

    return cards.filter((card) => card.section_id === activeSection.id);
  }, [activeSection, cards]);
  const normalizeTag = useCallback((tag: string) => tag.trim().replace(/^#+/, "").toLowerCase(), []);
  const getCardTags = useCallback((card: Card) => {
    if (!Array.isArray(card.tags)) {
      return [];
    }

    return card.tags.filter(
      (tag): tag is string => typeof tag === "string" && tag.trim().length > 0
    );
  }, []);
  const getNormalizedCardTags = useCallback(
    (card: Card) => getCardTags(card).map(normalizeTag),
    [getCardTags, normalizeTag]
  );
  const availableFilterTags = useMemo(
    () => {
      const normalized = new Set(activeCards.flatMap((card) => getNormalizedCardTags(card)));

      if (activeCards.some((card) => normalizeTag(card.type ?? "") === "painting")) {
        normalized.add("art");
      }

      return Array.from(normalized).sort();
    },
    [activeCards, getNormalizedCardTags, normalizeTag]
  );
  const effectiveSelectedTags = useMemo(
    () => selectedTags.filter((tag) => availableFilterTags.includes(tag)),
    [availableFilterTags, selectedTags]
  );

  const getCardPoints = useCallback((card: Card) => {
    if (!Array.isArray(card.points)) {
      return [];
    }

    return card.points.filter(
      (point): point is string => typeof point === "string" && point.trim().length > 0
    );
  }, []);

  const getCardLinks = useCallback((card: Card) => {
    const { links } = card;

    if (Array.isArray(links)) {
      return links.filter(
        (link): link is { label: string; url: string } =>
          !!link &&
          typeof link === "object" &&
          typeof link.label === "string" &&
          link.label.trim().length > 0 &&
          typeof link.url === "string" &&
          link.url.trim().length > 0
      );
    }

    const singleLink = !Array.isArray(links) && links && typeof links === "object" ? links : null;

    if (
      singleLink &&
      typeof singleLink.label === "string" &&
      typeof singleLink.url === "string" &&
      singleLink.label.trim().length > 0 &&
      singleLink.url.trim().length > 0
    ) {
      return [{ label: singleLink.label, url: singleLink.url }];
    }

    return [];
  }, []);

  const matchesSelectedTags = useCallback(
    (card: Card) => {
      const normalizedTags = getNormalizedCardTags(card);

      return effectiveSelectedTags.every((selectedTag) => {
        if (normalizedTags.includes(selectedTag)) {
          return true;
        }

        if (selectedTag === "art") {
          return normalizeTag(card.type ?? "") === "painting";
        }

        return false;
      });
    },
    [effectiveSelectedTags, getNormalizedCardTags, normalizeTag]
  );

  const visibleCards = useMemo(
    () => activeCards.filter(matchesSelectedTags),
    [activeCards, matchesSelectedTags]
  );
  const activeCardIds = useMemo(() => new Set(visibleCards.map((card) => card.id)), [visibleCards]);
  const effectiveMobileActiveCardId =
    mobileActiveCardId && activeCardIds.has(mobileActiveCardId) ? mobileActiveCardId : null;
  const effectiveFocusedCardId =
    focusedCardId && activeCardIds.has(focusedCardId) ? focusedCardId : null;
  const effectiveExpandedCardId =
    expandedCardId && activeCardIds.has(expandedCardId) ? expandedCardId : null;
  const firstVisibleCardId = visibleCards.length ? visibleCards[0].id : null;
  const lastVisibleCardId = visibleCards.length ? visibleCards[visibleCards.length - 1].id : null;
  const layoutExpandedCardId =
    effectiveExpandedCardId ??
    effectiveFocusedCardId ??
    (!isRailScrolling && hoveredCardId && activeCardIds.has(hoveredCardId) ? hoveredCardId : null);
  const isLastCardExpandedLeft =
    layoutExpandedCardId !== null &&
    layoutExpandedCardId === lastVisibleCardId &&
    expansionAnchor === "right";
  const deferredCommandValue = useDeferredValue(commandValue);
  const normalizedSearchQuery = deferredCommandValue.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedSearchQuery && effectiveSelectedTags.length === 0) {
      return [];
    }

    return cards
      .filter(matchesSelectedTags)
      .map((card) => {
        const section = sectionById.get(card.section_id) ?? null;

        if (!section) {
          return null;
        }

        if (!normalizedSearchQuery) {
          return { card, section };
        }

        const searchText = [
          card.title,
          card.subtitle,
          card.description,
          section.name,
          ...getCardTags(card),
          ...getCardPoints(card),
        ]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join(" ")
          .toLowerCase();

        return searchText.includes(normalizedSearchQuery) ? { card, section } : null;
      })
      .filter((result): result is { card: Card; section: Section } => result !== null)
      .sort((left, right) => {
        if (left.section.order_index !== right.section.order_index) {
          return left.section.order_index - right.section.order_index;
        }

        return left.card.order_index - right.card.order_index;
      });
  }, [
    cards,
    effectiveSelectedTags.length,
    getCardPoints,
    getCardTags,
    matchesSelectedTags,
    normalizedSearchQuery,
    sectionById,
  ]);
  const safeActiveResultIndex = searchResults.length
    ? Math.min(activeResultIndex, searchResults.length - 1)
    : -1;
  const showSearchPanel =
    isCommandFocused &&
    (!!normalizedSearchQuery || effectiveSelectedTags.length > 0 || commandValue.length > 0);
  const canScrollVertically = useCallback((element: HTMLDivElement | null) => {
    if (!element) {
      return false;
    }

    return element.scrollHeight > element.clientHeight + 1;
  }, []);

  const isTrackpadLikeEvent = useCallback((event: WheelEvent) => {
    if (event.deltaMode !== 0) {
      return false;
    }

    if (Math.abs(event.deltaX) > 0) {
      return true;
    }

    return !Number.isInteger(event.deltaY) || Math.abs(event.deltaY) < 40;
  }, []);

  const resetTrackpadGestureLock = useCallback(() => {
    trackpadGestureAxisRef.current = null;
    trackpadGestureTotalsRef.current = { x: 0, y: 0 };

    if (trackpadGestureTimeoutRef.current !== null) {
      window.clearTimeout(trackpadGestureTimeoutRef.current);
      trackpadGestureTimeoutRef.current = null;
    }
  }, []);

  const clearHoverActivationTimeout = useCallback(() => {
    if (hoverActivationTimeoutRef.current !== null) {
      window.clearTimeout(hoverActivationTimeoutRef.current);
      hoverActivationTimeoutRef.current = null;
    }
  }, []);

  const resetDesktopCardInteraction = useCallback(() => {
    clearHoverActivationTimeout();
    setHoveredCardId(null);
    setExpandedCardId(null);
    setFocusedCardId(null);
    setExpansionAnchor("left");
  }, [clearHoverActivationTimeout]);

  const resetMobileCardInteraction = useCallback(() => {
    setMobileActiveCardId(null);
  }, []);

  const resetCardInteraction = useCallback(() => {
    resetDesktopCardInteraction();
    resetMobileCardInteraction();
  }, [resetDesktopCardInteraction, resetMobileCardInteraction]);

  const armTrackpadGestureLockTimeout = useCallback(() => {
    if (trackpadGestureTimeoutRef.current !== null) {
      window.clearTimeout(trackpadGestureTimeoutRef.current);
    }

    trackpadGestureTimeoutRef.current = window.setTimeout(() => {
      resetTrackpadGestureLock();
    }, 140);
  }, [resetTrackpadGestureLock]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("portfolio-theme");
    document.documentElement.dataset.theme =
      savedTheme === "dark" ? "dark" : "light";
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 560px)");
    const syncMobileViewport = (event?: MediaQueryListEvent) => {
      const matches = event?.matches ?? mediaQuery.matches;

      setIsMobileViewport(matches);

      if (!matches) {
        setIsMobileMenuOpen(false);
        setMobileActiveCardId(null);
      }
    };

    syncMobileViewport();
    mediaQuery.addEventListener("change", syncMobileViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncMobileViewport);
    };
  }, []);

  const syncCommandCaret = useCallback(() => {
    const input = commandInputRef.current;

    if (!input) {
      return;
    }

    setCaretIndex(input.selectionStart ?? input.value.length);
    setInputScrollLeft(input.scrollLeft);
  }, []);

  const focusCommand = useCallback(
    (moveCaretToEnd = false) => {
      const input = commandInputRef.current;

      if (!input) {
        return;
      }

      input.focus();

      if (moveCaretToEnd) {
        const nextCaretIndex = input.value.length;
        input.setSelectionRange(nextCaretIndex, nextCaretIndex);
      }

      requestAnimationFrame(() => {
        syncCommandCaret();
      });
    },
    [syncCommandCaret]
  );

  useLayoutEffect(() => {
    const measure = commandMeasureRef.current;

    if (!measure) {
      return;
    }

    setCaretOffset(Math.max(0, measure.offsetWidth - inputScrollLeft));
  }, [caretIndex, commandValue, inputScrollLeft]);

  const syncSidebarBrandMetrics = useCallback(() => {
    const shell = shellRef.current;
    const indexNode = firstCardIndexRef.current;

    if (!shell || !indexNode) {
      return;
    }

    const shellRect = shell.getBoundingClientRect();
    const indexRect = indexNode.getBoundingClientRect();

    shell.style.setProperty("--brand-top-offset", `${indexRect.top - shellRect.top}px`);
    shell.style.setProperty("--brandmark-height", `${indexRect.height}px`);
  }, []);

  useLayoutEffect(() => {
    syncSidebarBrandMetrics();

    const shell = shellRef.current;
    const indexNode = firstCardIndexRef.current;

    if (!shell || !indexNode) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      syncSidebarBrandMetrics();
    });

    resizeObserver.observe(shell);
    resizeObserver.observe(indexNode);
    window.addEventListener("resize", syncSidebarBrandMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncSidebarBrandMetrics);
    };
  }, [activeSlug, firstVisibleCardId, syncSidebarBrandMetrics, visibleCards.length]);

  const markRailScrolling = useCallback(() => {
    setIsRailScrolling(true);

    if (scrollIdleTimeoutRef.current !== null) {
      window.clearTimeout(scrollIdleTimeoutRef.current);
    }

    scrollIdleTimeoutRef.current = window.setTimeout(() => {
      setIsRailScrolling(false);
      scrollIdleTimeoutRef.current = null;
    }, 500);
  }, []);

  const navigateToCard = useCallback(
    (sectionSlug: string, cardId: string) => {
      clearHoverActivationTimeout();
      commandInputRef.current?.blur();
      setIsCommandFocused(false);
      setPendingSectionSlug(sectionSlug);
      if (isMobileViewport) {
        resetDesktopCardInteraction();
        setMobileActiveCardId(cardId);
      } else {
        setFocusedCardId(cardId);
        setExpandedCardId(cardId);
        setHoveredCardId(cardId);
        setExpansionAnchor("left");
      }
      setNavigationTargetCardId(cardId);
      setIsFilterOpen(false);
      setIsMobileMenuOpen(false);
      router.push(`/${sectionSlug}`);
    },
    [clearHoverActivationTimeout, isMobileViewport, resetDesktopCardInteraction, router]
  );

  const activateMobileCard = useCallback((cardId: string) => {
    const stage = stageRef.current;
    const cardNode = cardRefs.current[cardId];
    const cardScroll = cardScrollRefs.current[cardId];

    resetDesktopCardInteraction();
    setMobileActiveCardId(cardId);
    setIsMobileMenuOpen(false);
    setIsFilterOpen(false);

    if (stage && cardNode) {
      stage.scrollTo({
        left: cardNode.offsetLeft,
        behavior: "smooth",
      });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextStage = stageRef.current;
        const nextCardNode = cardRefs.current[cardId];
        const nextCardScroll = cardScrollRefs.current[cardId] ?? cardScroll;

        if (nextStage && nextCardNode) {
          const stageRect = nextStage.getBoundingClientRect();
          const cardRect = nextCardNode.getBoundingClientRect();
          const maxScrollLeft = Math.max(0, nextStage.scrollWidth - nextStage.clientWidth);
          const alignedScrollLeft = Math.max(
            0,
            Math.min(maxScrollLeft, nextStage.scrollLeft + (cardRect.left - stageRect.left))
          );

          nextStage.scrollTo({
            left: alignedScrollLeft,
            behavior: "smooth",
          });
        }

        if (nextCardScroll) {
          nextCardScroll.scrollTop = 0;
        }
      });
    });
  }, [resetDesktopCardInteraction]);

  const measureCardExpansionAnchor = useCallback((cardId: string) => {
    const stage = stageRef.current;
    const card = cardRefs.current[cardId];

    if (!stage || !card) {
      return {
        anchor: "left" as ExpansionAnchor,
        needsAlignment: false,
        targetScrollLeft: null as number | null,
      };
    }

    const stageRect = stage.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const maxScrollLeft = Math.max(0, stage.scrollWidth - stage.clientWidth);
    const stageStyles = window.getComputedStyle(stage);
    const defaultWidth = Number.parseFloat(stageStyles.getPropertyValue("--card-width")) || cardRect.width;
    const expandedWidth =
      Number.parseFloat(stageStyles.getPropertyValue("--card-width-expanded")) || defaultWidth * 1.5;
    const expansionDelta = Math.max(0, expandedWidth - defaultWidth);
    const isLastCard = cardId === lastVisibleCardId;
    const leftClipped = cardRect.left < stageRect.left - 1;
    const rightClipped = cardRect.right > stageRect.right + 1;
    const availableRight = stageRect.right - cardRect.right;
    const isRightAligned = Math.abs(cardRect.right - stageRect.right) <= 1;

    if (!isLastCard && leftClipped) {
      return {
        anchor: "left" as ExpansionAnchor,
        needsAlignment: true,
        targetScrollLeft: Math.max(
          0,
          Math.min(maxScrollLeft, stage.scrollLeft - (stageRect.left - cardRect.left))
        ),
      };
    }

    if (isLastCard) {
      if (rightClipped || isRightAligned || availableRight < expansionDelta) {
        return {
          anchor: "right" as ExpansionAnchor,
          needsAlignment: !isRightAligned && stage.scrollLeft < maxScrollLeft,
          targetScrollLeft: maxScrollLeft,
        };
      }

      return {
        anchor: "left" as ExpansionAnchor,
        needsAlignment: false,
        targetScrollLeft: null,
      };
    }

    return {
      anchor: "left" as ExpansionAnchor,
      needsAlignment: false,
      targetScrollLeft: null,
    };
  }, [lastVisibleCardId]);

  const beginCardHover = useCallback(
    (cardId: string) => {
      clearHoverActivationTimeout();

      const stage = stageRef.current;
      const measurement = measureCardExpansionAnchor(cardId);

      setExpansionAnchor(measurement.anchor);

      if (!stage || !measurement.needsAlignment || measurement.targetScrollLeft === null) {
        setHoveredCardId(cardId);
        return;
      }

      stage.scrollTo({
        left: measurement.targetScrollLeft,
        behavior: "smooth",
      });

      hoverActivationTimeoutRef.current = window.setTimeout(() => {
        setHoveredCardId(cardId);
        hoverActivationTimeoutRef.current = null;
      }, 180);
    },
    [clearHoverActivationTimeout, measureCardExpansionAnchor]
  );

  useEffect(() => {
    if (isMobileViewport) {
      return;
    }

    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.deltaX && !event.deltaY) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      const targetScroll = target?.closest(".shell-card__scroll") as HTMLDivElement | null;
      const focusedScroll = effectiveFocusedCardId
        ? cardScrollRefs.current[effectiveFocusedCardId] ?? null
        : null;
      const isTrackpad = isTrackpadLikeEvent(event);

      if (isTrackpad) {
        const totals = trackpadGestureTotalsRef.current;

        armTrackpadGestureLockTimeout();

        if (trackpadGestureAxisRef.current === null) {
          totals.x += Math.abs(event.deltaX);
          totals.y += Math.abs(event.deltaY);

          if (Math.max(totals.x, totals.y) >= 8) {
            trackpadGestureAxisRef.current = totals.x > totals.y ? "x" : "y";
          } else {
            return;
          }
        }

        if (trackpadGestureAxisRef.current === "x") {
          const horizontalDelta =
            Math.abs(event.deltaX) > 0.5 ? event.deltaX : event.deltaY;

          markRailScrolling();
          event.preventDefault();
          event.stopPropagation();
          stage.scrollLeft += horizontalDelta;
          return;
        }

        if (targetScroll && Math.abs(event.deltaY) > 0.5 && canScrollVertically(targetScroll)) {
          const cardId = targetScroll.closest(".shell-card")?.getAttribute("data-card-id");

          if (cardId) {
            setExpansionAnchor(measureCardExpansionAnchor(cardId).anchor);
            setHoveredCardId(cardId);
            setExpandedCardId(cardId);
          }

          event.preventDefault();
          event.stopPropagation();
          targetScroll.scrollTop += event.deltaY;
          return;
        }

        return;
      }

      if (focusedScroll) {
        event.preventDefault();
        event.stopPropagation();
        focusedScroll.scrollTop += event.deltaY || event.deltaX;
        return;
      }

      markRailScrolling();
      event.preventDefault();
      event.stopPropagation();
      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      stage.scrollLeft += dominantDelta;
    };

    const handleScroll = () => {
      markRailScrolling();
    };

    stage.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    stage.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      stage.removeEventListener("wheel", handleWheel, true);
      stage.removeEventListener("scroll", handleScroll);
    };
  }, [
    armTrackpadGestureLockTimeout,
    canScrollVertically,
    effectiveFocusedCardId,
    isMobileViewport,
    isTrackpadLikeEvent,
    markRailScrolling,
    measureCardExpansionAnchor,
  ]);

  useEffect(() => {
    return () => {
      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
      }

      clearHoverActivationTimeout();
      resetTrackpadGestureLock();
    };
  }, [clearHoverActivationTimeout, resetTrackpadGestureLock]);

  useEffect(() => {
    const clearPressedControl = () => {
      setPressedControl(null);
    };

    window.addEventListener("pointerup", clearPressedControl);
    window.addEventListener("pointercancel", clearPressedControl);

    return () => {
      window.removeEventListener("pointerup", clearPressedControl);
      window.removeEventListener("pointercancel", clearPressedControl);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      const withinFilterButton = filterButtonRef.current?.contains(target) ?? false;
      const withinFilterPanel = filterPanelRef.current?.contains(target) ?? false;

      if (!withinFilterButton && !withinFilterPanel) {
        setIsFilterOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!navigationTargetCardId) {
      return;
    }

    let frame = 0;
    let secondFrame = 0;

    frame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const cardNode = cardRefs.current[navigationTargetCardId];
        const cardScroll = cardScrollRefs.current[navigationTargetCardId];

        cardNode?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });

        if (cardScroll) {
          cardScroll.scrollTop = 0;
        }

        setNavigationTargetCardId(null);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [navigationTargetCardId, activeSlug, visibleCards.length]);

  useEffect(() => {
    if (!showSearchPanel || safeActiveResultIndex < 0) {
      return;
    }

    const activeResult = searchResults[safeActiveResultIndex];

    if (!activeResult) {
      return;
    }

    const resultKey = `${activeResult.section.slug}-${activeResult.card.id}`;
    const node = searchResultRefs.current[resultKey];

    node?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [safeActiveResultIndex, searchResults, showSearchPanel]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        focusCommand(true);
        return;
      }

      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        resetCardInteraction();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [focusCommand, resetCardInteraction]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";

    root.dataset.theme = nextTheme;
    window.localStorage.setItem("portfolio-theme", nextTheme);
  };

  const formatCardTitle = (card: Card) => {
    return card.title?.trim() || card.subtitle?.trim() || "Untitled";
  };

  const toggleSelectedTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
    setActiveResultIndex(0);
  };

  return (
    <div
      ref={shellRef}
      className={`shell ${isMobileViewport ? "shell--mobile" : ""} ${
        isMobileMenuOpen ? "is-mobile-menu-open" : ""
      }`}
    >
      <aside className="shell-sidebar">
        <div className="shell-sidebar__brand">
          <div className="shell-brandstack">
            <Image
              src={wordmark}
              alt="Shaikh Mohammed Ahmed"
              className="shell-brandmark shell-brandmark--light"
              priority
            />
            <Image
              src={darkWordmark}
              alt="Shaikh Mohammed Ahmed"
              className="shell-brandmark shell-brandmark--dark"
              priority
            />
          </div>
          <button
            type="button"
            className={`shell-mobile-menu-button ${isMobileMenuOpen ? "is-open" : ""}`}
            aria-label={isMobileMenuOpen ? "Close sections menu" : "Open sections menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => {
              commandInputRef.current?.blur();
              setIsCommandFocused(false);
              setIsFilterOpen(false);
              setIsMobileMenuOpen((current) => !current);
            }}
          >
            <span className="shell-mobile-menu-button__line" aria-hidden="true" />
            <span className="shell-mobile-menu-button__line" aria-hidden="true" />
            <span className="shell-mobile-menu-button__line" aria-hidden="true" />
          </button>
        </div>

        <nav className="shell-sidebar__nav" aria-label="Sections">
          {sections.map((section) => {
            const href = `/${section.slug}`;
            const isActive = pathname === href;

            return (
              <Link
                key={section.id}
                href={href}
                className={`shell-nav-item ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  resetCardInteraction();
                  setPendingSectionSlug(section.slug);
                  setIsMobileMenuOpen(false);
                }}
              >
                {section.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="shell-main">
        <header className="shell-topbar">
          <div className="shell-topbar__group">
            <button
              type="button"
              className="topbar-button"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <Image
                src={moonIcon}
                alt=""
                aria-hidden="true"
                className="topbar-icon topbar-icon--moon"
              />
              <Image
                src={sunIcon}
                alt=""
                aria-hidden="true"
                className="topbar-icon topbar-icon--sun"
              />
            </button>
            <button
              type="button"
              className={`topbar-button ${pressedControl === "search" ? "is-pressed" : ""}`}
              aria-label="Focus search"
              onPointerDown={() => {
                setPressedControl("search");
              }}
              onClick={() => {
                setIsMobileMenuOpen(false);
                focusCommand(true);
              }}
            >
              <Image
                src={searchIcon}
                alt=""
                aria-hidden="true"
                className="topbar-icon topbar-icon--search"
              />
            </button>
            <button
              ref={filterButtonRef}
              type="button"
              className={`topbar-button ${pressedControl === "filter" ? "is-pressed" : ""}`}
              aria-label="Filter"
              onPointerDown={() => {
                setPressedControl("filter");
              }}
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsFilterOpen((current) => !current);
              }}
            >
              <Image
                src={filterIcon}
                alt=""
                aria-hidden="true"
                className="topbar-icon topbar-icon--filter"
              />
            </button>
            <div
              className={`topbar-command ${isCommandFocused ? "is-focused" : ""}`}
              onClick={() => {
                setIsMobileMenuOpen(false);
                focusCommand();
              }}
            >
              <div className="topbar-command__field">
                <span ref={commandMeasureRef} className="topbar-command__measure" aria-hidden="true">
                  {commandValue.slice(0, caretIndex)}
                </span>
                <input
                  ref={commandInputRef}
                  type="text"
                  value={commandValue}
                  inputMode="search"
                  enterKeyHint="search"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Search"
                  className="topbar-command__input"
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      if (!searchResults.length) {
                        return;
                      }

                      event.preventDefault();
                      setActiveResultIndex((current) =>
                        current >= searchResults.length - 1 ? 0 : current + 1
                      );
                      return;
                    }

                    if (event.key === "ArrowUp") {
                      if (!searchResults.length) {
                        return;
                      }

                      event.preventDefault();
                      setActiveResultIndex((current) =>
                        current <= 0 ? searchResults.length - 1 : current - 1
                      );
                      return;
                    }

                    if (event.key === "Enter") {
                      const nextResult =
                        safeActiveResultIndex >= 0 ? searchResults[safeActiveResultIndex] : null;

                      if (!nextResult) {
                        return;
                      }

                      event.preventDefault();
                      navigateToCard(nextResult.section.slug, nextResult.card.id);
                    }
                  }}
                  onChange={(event) => {
                    setCommandValue(event.target.value);
                    setCaretIndex(event.target.selectionStart ?? event.target.value.length);
                    setInputScrollLeft(event.target.scrollLeft);
                    setActiveResultIndex(0);
                  }}
                  onClick={syncCommandCaret}
                  onFocus={() => {
                    setIsCommandFocused(true);
                    syncCommandCaret();
                  }}
                  onBlur={() => {
                    setIsCommandFocused(false);
                    syncCommandCaret();
                  }}
                  onKeyUp={syncCommandCaret}
                  onMouseUp={syncCommandCaret}
                  onScroll={syncCommandCaret}
                  onSelect={syncCommandCaret}
                />
                <span
                  className="topbar-command__cursor"
                  aria-hidden="true"
                  style={{ transform: `translate3d(${caretOffset}px, -50%, 0)` }}
                />
              </div>
            </div>
          </div>
          <div className="shell-topbar__status">Easter Eggs 0/3</div>
        </header>

        <div
          className={`shell-mobile-menu-panel ${isMobileMenuOpen ? "is-open" : ""}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="shell-mobile-menu-panel__inner">
            <nav className="shell-mobile-menu-panel__nav" aria-label="Mobile sections">
              {sections.map((section) => {
                const href = `/${section.slug}`;
                const isActive = pathname === href;

                return (
                  <Link
                    key={`mobile-${section.id}`}
                    href={href}
                    className={`shell-nav-item ${isActive ? "is-active" : ""}`}
                    onClick={() => {
                      resetCardInteraction();
                      setPendingSectionSlug(section.slug);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {section.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {showSearchPanel ? (
          <div className="shell-search-panel" onMouseDown={(event) => event.preventDefault()}>
            {searchResults.length > 0 ? (
              <div className="shell-search-results" role="listbox" aria-label="Search results">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.section.slug}-${result.card.id}`}
                    ref={(node) => {
                      searchResultRefs.current[`${result.section.slug}-${result.card.id}`] = node;
                    }}
                    type="button"
                    className={`shell-search-result ${
                      index === safeActiveResultIndex ? "is-active" : ""
                    }`}
                    onMouseEnter={() => {
                      setActiveResultIndex(index);
                    }}
                    onFocus={() => {
                      setActiveResultIndex(index);
                    }}
                    onClick={() => {
                      navigateToCard(result.section.slug, result.card.id);
                    }}
                  >
                    <span className="shell-search-result__eyebrow">{result.section.name}</span>
                    <span className="shell-search-result__title">
                      {String(result.card.order_index).padStart(2, "0")} {formatCardTitle(result.card)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="shell-search-empty">No matching cards.</div>
            )}
          </div>
        ) : null}

        {isFilterOpen ? (
          <div
            ref={filterPanelRef}
            className="shell-filter-panel"
            onMouseDown={(event) => event.preventDefault()}
          >
            {availableFilterTags.length > 0 ? (
              <div className="shell-filter-tags">
                {availableFilterTags.map((tag) => {
                  const isSelected = effectiveSelectedTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`shell-filter-tag ${isSelected ? "is-selected" : ""}`}
                      onClick={() => {
                        toggleSelectedTag(tag);
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="shell-search-empty">No tags found.</div>
            )}
          </div>
        ) : null}

        <div
          ref={stageRef}
          className={`shell-stage ${isRailScrolling ? "is-scrolling" : ""} ${
            effectiveFocusedCardId ? "has-focused-card" : ""
          } ${effectiveMobileActiveCardId ? "has-mobile-active-card" : ""} ${
            isLastCardExpandedLeft ? "is-last-card-expand-left" : ""
          }`}
        >
          <div className="shell-rail">
            {visibleCards.map((card, index) => (
              (() => {
                const isDesktopFocused = !isMobileViewport && effectiveFocusedCardId === card.id;
                const isExpandedLocked = !isMobileViewport && effectiveExpandedCardId === card.id;
                const isInteractivelyExpanded = !isMobileViewport && layoutExpandedCardId === card.id;
                const isMobileActive = isMobileViewport && effectiveMobileActiveCardId === card.id;
                const isPainting = normalizeTag(card.type ?? "") === "painting";
                const isMobilePaintingFullscreen = isMobileActive && isPainting;
                const cardTags = getCardTags(card);
                const cardPoints = getCardPoints(card);
                const cardLinks = getCardLinks(card);

                return (
              <article
                key={card.id}
                ref={(node) => {
                  cardRefs.current[card.id] = node;
                }}
                className={`shell-card ${
                  isPainting ? "shell-card--painting" : "shell-card--project"
                } ${card.image_url ? "shell-card--with-image" : ""} ${
                  isDesktopFocused ? "is-focused" : ""
                } ${isExpandedLocked ? "is-expanded-locked" : ""} ${
                  isInteractivelyExpanded ? "is-expanded" : ""
                } ${isMobileActive ? "is-mobile-active" : ""} ${
                  isMobilePaintingFullscreen ? "is-mobile-painting-fullscreen" : ""
                }`}
                data-card-id={card.id}
                onPointerDown={(event) => {
                  if (!isMobileViewport || event.pointerType !== "touch") {
                    return;
                  }

                  mobileTouchStartRef.current = {
                    cardId: card.id,
                    x: event.clientX,
                    y: event.clientY,
                  };
                  mobileTouchDraggingRef.current = false;
                }}
                onPointerMove={(event) => {
                  if (!isMobileViewport || event.pointerType !== "touch") {
                    return;
                  }

                  const touchStart = mobileTouchStartRef.current;

                  if (!touchStart || touchStart.cardId !== card.id) {
                    return;
                  }

                  if (
                    Math.abs(event.clientX - touchStart.x) > 10 ||
                    Math.abs(event.clientY - touchStart.y) > 10
                  ) {
                    mobileTouchDraggingRef.current = true;
                  }
                }}
                onPointerCancel={() => {
                  mobileTouchStartRef.current = null;
                  mobileTouchDraggingRef.current = false;
                }}
                onClick={() => {
                  if (isMobileViewport) {
                    if (mobileTouchDraggingRef.current) {
                      mobileTouchStartRef.current = null;
                      mobileTouchDraggingRef.current = false;
                      return;
                    }

                    mobileTouchStartRef.current = null;
                    activateMobileCard(card.id);
                    return;
                  }

                  clearHoverActivationTimeout();
                  const measurement = measureCardExpansionAnchor(card.id);
                  const stage = stageRef.current;

                  setExpansionAnchor(measurement.anchor);
                  setHoveredCardId(card.id);
                  setExpandedCardId(card.id);
                  setFocusedCardId(card.id);

                  if (stage && measurement.needsAlignment && measurement.targetScrollLeft !== null) {
                    stage.scrollTo({
                      left: measurement.targetScrollLeft,
                      behavior: "smooth",
                    });
                  }
                }}
                onPointerEnter={() => {
                  if (isMobileViewport) {
                    return;
                  }

                  beginCardHover(card.id);
                }}
                onPointerLeave={() => {
                  if (isMobileViewport) {
                    return;
                  }

                  clearHoverActivationTimeout();
                  setHoveredCardId((current) => (current === card.id ? null : current));
                  setExpandedCardId((current) => (current === card.id ? null : current));
                  setFocusedCardId((current) => (current === card.id ? null : current));
                  setExpansionAnchor("left");
                }}
              >
                <button
                  type="button"
                  className="shell-card__mobile-art-back"
                  aria-label="Back to cards"
                  onClick={(event) => {
                    event.stopPropagation();
                    resetMobileCardInteraction();
                  }}
                >
                  <Image
                    src={backArrowLight}
                    alt=""
                    aria-hidden="true"
                    className="shell-card__mobile-back-icon shell-card__mobile-back-icon--light"
                  />
                  <Image
                    src={backArrowDark}
                    alt=""
                    aria-hidden="true"
                    className="shell-card__mobile-back-icon shell-card__mobile-back-icon--dark"
                  />
                </button>
                <div
                  ref={(node) => {
                    cardScrollRefs.current[card.id] = node;
                  }}
                  className="shell-card__scroll"
                >
                  <div className="shell-card__content">
                    <button
                      type="button"
                      className="shell-card__mobile-back"
                      aria-label="Back to cards"
                      onClick={(event) => {
                        event.stopPropagation();
                        resetMobileCardInteraction();
                      }}
                    >
                      <Image
                        src={backArrowLight}
                        alt=""
                        aria-hidden="true"
                        className="shell-card__mobile-back-icon shell-card__mobile-back-icon--light"
                      />
                      <Image
                        src={backArrowDark}
                        alt=""
                        aria-hidden="true"
                        className="shell-card__mobile-back-icon shell-card__mobile-back-icon--dark"
                      />
                    </button>
                    <div
                      ref={index === 0 ? firstCardIndexRef : null}
                      className="shell-card__index"
                    >
                      {String(card.order_index).padStart(2, "0")}
                    </div>

                    {card.audio_length || card.audio_url ? (
                      <div className="shell-card__media-row">
                        <button
                          type="button"
                          className="shell-card__play"
                          aria-label={card.audio_url ? `Play ${formatCardTitle(card)}` : "Audio preview"}
                        >
                          <span className="shell-card__play-triangle" aria-hidden="true" />
                        </button>
                        <span className="shell-card__duration">{card.audio_length ?? ""}</span>
                      </div>
                    ) : null}

                    {card.image_url ? (
                      <div className="shell-card__image-frame">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.image_url}
                          alt={formatCardTitle(card)}
                          className="shell-card__image"
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    <div className="shell-card__body">
                      <h2 className="shell-card__title">{formatCardTitle(card)}</h2>

                      {cardTags.length > 0 ? (
                        <div className="shell-card__tags" aria-label="Tags">
                          {cardTags.map((tag) => (
                            <span key={`${card.id}-${tag}`} className="shell-card__tag">
                              {tag.startsWith("#") ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {card.description ? (
                        <p className="shell-card__description">{card.description}</p>
                      ) : null}

                      {cardPoints.length > 0 ? (
                        <ul className="shell-card__points">
                          {cardPoints.map((point) => (
                            <li key={`${card.id}-${point}`} className="shell-card__point">
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {cardLinks.length > 0 ? (
                        <div className="shell-card__references">
                          <div className="shell-card__references-title">References</div>
                          <div className="shell-card__links">
                            {cardLinks.map((link, index) => (
                              <a
                                key={`${card.id}-${link.url}-${index}`}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="shell-card__link"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
                );
              })()
            ))}
            {!activeSection ? children : null}
          </div>
        </div>

      </section>
    </div>
  );
}
