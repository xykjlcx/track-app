import {json} from "@remix-run/node";
import {useLoaderData, useNavigate} from "@remix-run/react";
import {authenticate} from "../shopify.server";
import {
  Button,
  Card,
  ChoiceList,
  IndexFilters,
  IndexFiltersProps,
  IndexTable,
  Page,
  RangeSlider,
  TabProps,
  TextField,
  useIndexResourceState,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import {Range, SelectionType} from "@shopify/polaris/build/ts/src/utilities/index-provider/types";
import {useCallback, useState} from "react";
import {useAppBridge} from "@shopify/app-bridge-react";

export async function loader({request}) {
  const {admin, session} = await authenticate.admin(request);
  const qrCodes = [{id: 1001}, {id: 1002}, {id: 1003}];

  console.log('打印request：',request)
  console.log('打印session：',session)
  console.log('打印apiKey：',process.env.SHOPIFY_API_KEY)


  return json({
    qrCodes,
  });
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  console.log('收到action通知，admin:',admin);
  console.log('收到action通知，request:',request);

  return json({
    tempList: [{id:'test',name:'测试使用'}],
  });
};

function disambiguateLabel(key: string, value: string | any[]): string {
  switch (key) {
    case 'moneySpent':
      return `Money spent is between $${value[0]} and $${value[1]}`;
    case 'taggedWith':
      return `Tagged with ${value}`;
    case 'accountStatus':
      return (value as string[]).map((val) => `Customer ${val}`).join(', ');
    default:
      return value as string;
  }
}

function isEmpty(value: string | any[]) {
  if (Array.isArray(value)) {
    return value.length === 0;
  } else {
    return value === '' || value == null;
  }
}

export default function Index() {
  const {qrCodes} = useLoaderData();
  const navigate = useNavigate();

  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(qrCodes);

  const appBridge = useAppBridge();
  console.log('看看appBridge：',appBridge)


  console.log('当前勾选的行：',selectedResources)

  /* -------------------------------- */
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState([
    'All',
    'Unpaid',
    'Open',
    'Closed',
    'Local delivery',
    'Local pickup',
  ]);
  const deleteView = (index: number) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name: string) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs: TabProps[] = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
          {
            type: 'rename',
            onAction: () => {},
            onPrimaryAction: async (value: string): Promise<boolean> => {
              const newItemsStrings = tabs.map((item, idx) => {
                if (idx === index) {
                  return value;
                }
                return item.content;
              });
              await sleep(1);
              setItemStrings(newItemsStrings);
              return true;
            },
          },
          {
            type: 'duplicate',
            onPrimaryAction: async (value: string): Promise<boolean> => {
              await sleep(1);
              duplicateView(value);
              return true;
            },
          },
          {
            type: 'edit',
          },
          {
            type: 'delete',
            onPrimaryAction: async () => {
              await sleep(1);
              deleteView(index);
              return true;
            },
          },
        ],
  }));
  const [selected, setSelected] = useState(0);
  const onCreateNewView = async (value: string) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };
  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {label: 'Order', value: 'order asc', directionLabel: 'Ascending'},
    {label: 'Order', value: 'order desc', directionLabel: 'Descending'},
    {label: 'Customer', value: 'customer asc', directionLabel: 'A-Z'},
    {label: 'Customer', value: 'customer desc', directionLabel: 'Z-A'},
    {label: 'Date', value: 'date asc', directionLabel: 'A-Z'},
    {label: 'Date', value: 'date desc', directionLabel: 'Z-A'},
    {label: 'Total', value: 'total asc', directionLabel: 'Ascending'},
    {label: 'Total', value: 'total desc', directionLabel: 'Descending'},
  ];
  const [sortSelected, setSortSelected] = useState(['order asc']);
  const {mode, setMode} = useSetIndexFiltersMode();
  const onHandleCancel = () => {};

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction: IndexFiltersProps['primaryAction'] =
    selected === 0
      ? {
        type: 'save-as',
        onAction: onCreateNewView,
        disabled: false,
        loading: false,
      }
      : {
        type: 'save',
        onAction: onHandleSave,
        disabled: false,
        loading: false,
      };
  const [accountStatus, setAccountStatus] = useState<string[] | undefined>(
    undefined,
  );
  const [moneySpent, setMoneySpent] = useState<[number, number] | undefined>(
    undefined,
  );
  const [taggedWith, setTaggedWith] = useState('');
  const [queryValue, setQueryValue] = useState('');

  const handleAccountStatusChange = useCallback(
    (value: string[]) => setAccountStatus(value),
    [],
  );
  const handleMoneySpentChange = useCallback(
    (value: [number, number]) => setMoneySpent(value),
    [],
  );
  const handleTaggedWithChange = useCallback(
    (value: string) => setTaggedWith(value),
    [],
  );
  const handleFiltersQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );
  const handleAccountStatusRemove = useCallback(
    () => setAccountStatus(undefined),
    [],
  );
  const handleMoneySpentRemove = useCallback(
    () => setMoneySpent(undefined),
    [],
  );
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(''), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);
  const handleFiltersClearAll = useCallback(() => {
    handleAccountStatusRemove();
    handleMoneySpentRemove();
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, [
    handleAccountStatusRemove,
    handleMoneySpentRemove,
    handleQueryValueRemove,
    handleTaggedWithRemove,
  ]);

  const filters = [
    {
      key: 'accountStatus',
      label: 'Account status',
      filter: (
        <ChoiceList
          title="Account status"
          titleHidden
          choices={[
            {label: 'Enabled', value: 'enabled'},
            {label: 'Not invited', value: 'not invited'},
            {label: 'Invited', value: 'invited'},
            {label: 'Declined', value: 'declined'},
          ]}
          selected={accountStatus || []}
          onChange={handleAccountStatusChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: 'taggedWith',
      label: 'Tagged with',
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
    {
      key: 'moneySpent',
      label: 'Money spent',
      filter: (
        <RangeSlider
          label="Money spent is between"
          labelHidden
          value={moneySpent || [0, 500]}
          prefix="$"
          output
          min={0}
          max={2000}
          step={1}
          onChange={handleMoneySpentChange}
        />
      ),
    },
  ];

  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (accountStatus && !isEmpty(accountStatus)) {
    const key = 'accountStatus';
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, accountStatus),
      onRemove: handleAccountStatusRemove,
    });
  }
  if (moneySpent) {
    const key = 'moneySpent';
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, moneySpent),
      onRemove: handleMoneySpentRemove,
    });
  }
  if (!isEmpty(taggedWith)) {
    const key = 'taggedWith';
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, taggedWith),
      onRemove: handleTaggedWithRemove,
    });
  }

  console.log('打印查询参数：',queryValue)

  return (
    <Page
      fullWidth={true}
      title={"待发货订单"}
      primaryAction={
        {
          content: "导出待发货22",
          accessibilityLabel: "Export product list",
          onAction: async () => {
            shopify.toast.show('点击导出待发货');
            const sessionToken = await appBridge.idToken();
            console.log('看看idToken：',sessionToken)
          }
        }
      }
      secondaryActions={[
        {
          content: "导入发货单12",
          accessibilityLabel: "Export product list",
        },
      ]}>
      <div>
        <Button onClick={() => {
          console.log('准备开始打印')
          fetch('/test',{
            method:'post'
          }).then((res) => {
            console.log('客户端打印：',res)
          })
        }}>
          点我测试
        </Button>
      </div>
      <Card padding="0">
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Searching in all"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={() => setQueryValue('')}
          onSort={setSortSelected}
          primaryAction={primaryAction}
          cancelAction={{
            onAction: onHandleCancel,
            disabled: false,
            loading: false,
          }}
          tabs={tabs}
          selected={selected}
          onSelect={setSelected}
          canCreateNewView
          onCreateNewView={onCreateNewView}
          filters={filters}
          appliedFilters={appliedFilters}
          onClearAll={handleFiltersClearAll}
          mode={mode}
          setMode={setMode}
          showEditColumnsButton
        />
        <IndexTable
          resourceName={{
            singular: "QR code",
            plural: "QR codes",
          }}
          selectedItemsCount={
            selectedResources.length == qrCodes.length ? 'All' : selectedResources.length
          }
          onSelectionChange={(selectionType: SelectionType, toggleType: boolean, selection?: string | Range, position?: number) => {
            handleSelectionChange(selectionType as any, toggleType, selection, position)
          }}
          itemCount={qrCodes.length}
          headings={[
            {title: "订单"},
            {title: "客户"},
            {title: "渠道"},
            {title: "发货状态"},
            {title: "付款状态"},
            {title: "配送状态"},
            {title: "配送方式"},
          ]}
          selectable={true}
          tabs={tabs}
          selected={selected}
        >
          {qrCodes.map((qrCode) => (
            <IndexTable.Row
              id={qrCode.id}
              position={qrCode.id}
              selected={selectedResources.includes(qrCode.id)}
            >
              <IndexTable.Cell>qwe</IndexTable.Cell>
              <IndexTable.Cell>asd</IndexTable.Cell>
              <IndexTable.Cell>asd</IndexTable.Cell>
              <IndexTable.Cell>asd</IndexTable.Cell>
              <IndexTable.Cell>asd</IndexTable.Cell>
              <IndexTable.Cell>asd</IndexTable.Cell>
              <IndexTable.Cell>asd</IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
        {/*<Pagination*/}
        {/*  hasPrevious*/}
        {/*  onPrevious={() => {*/}
        {/*    console.log('Previous');*/}
        {/*  }}*/}
        {/*  hasNext*/}
        {/*  onNext={() => {*/}
        {/*    console.log('Next');*/}
        {/*  }}*/}
        {/*/>*/}
      </Card>
    </Page>
  );
}
